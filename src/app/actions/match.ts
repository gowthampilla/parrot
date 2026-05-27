"use server";

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Initialize AI Clients
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Helper: Get embeddings from OpenAI
async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// ------------------------------------------------------------------
// 1. SYNC PROFILE TO PINECONE (The function that went missing!)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 1. SYNC PROFILE TO PINECONE 
// ------------------------------------------------------------------
export async function syncProfileToPinecone(data: {
    userId: string;
    name: string;
    role: string;
    company: string;
    building: string;
    lookingFor: string;
    skills: string[];
  }) {
    try {
      // Create a dense string representing their entire identity
      const textToEmbed = `Role: ${data.role}. Building: ${data.building}. Looking for: ${data.lookingFor}. Skills: ${data.skills.join(", ")}`;
      const embedding = await getEmbedding(textToEmbed);
  
      const index = pinecone.index("quad-network");
      
      // FIX: We explicitly wrap the array in a 'records' object so TypeScript doesn't get confused by the SDK overloads.
      await index.upsert({
        records: [
          {
            id: data.userId,
            values: embedding,
            metadata: {
              name: data.name || "",
              role: data.role || "",
              company: data.company || "",
              building: data.building || "",
              lookingFor: data.lookingFor || "",
              skills: data.skills || [], 
            }
          }
        ]
      });
  
      return { success: true };
    } catch (error: any) {
      console.error("Pinecone Sync Error:", error);
      return { success: false, error: error.message };
    }
  }
// ------------------------------------------------------------------
// 2. THE PRODUCTION-GRADE ALGORITHM: TWO-STAGE REC-SYS
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 2. THE PRODUCTION-GRADE ALGORITHM: TWO-STAGE REC-SYS
// ------------------------------------------------------------------
export async function findIntentMatches(userId: string, intentText: string, limit: number = 10) {
    try {
      const supabase = await createClient();
      
      // 1. Fetch the exact profile of the person doing the searching (The Searcher)
      const { data: searcher } = await supabase.from("users").select("*").eq("id", userId).single();
      if (!searcher) throw new Error("Searcher not found");
  
      console.log(`\n🔍 [STAGE 1] Searching Pinecone for ${searcher.name}...`);
  
      const queryEmbedding = await getEmbedding(`Looking for: ${searcher.looking_for}. Domain: ${searcher.building}`);
      
      const index = pinecone.index("quad-intent-matches");
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 20,
        includeMetadata: true,
        // FIX: Removed the broken Pinecone filter!
      });
  
      // FIX: Filter out the current user manually in JavaScript
      const validMatches = (queryResponse.matches || []).filter(m => m.id !== userId);
      
      console.log(`✅ [STAGE 1] Pinecone found ${validMatches.length} total people in the database.`);
  
      if (validMatches.length === 0) {
        return { success: true, matches: [] };
      }
  
      // ==========================================
      // STAGE 2: LLM RE-RANKING (Supply vs Demand Matrix)
      // ==========================================
      console.log(`🧠 [STAGE 2] Sending to GPT-4o-mini for Asymmetric Scoring...`);
      
      const candidateProfiles = validMatches.map(m => ({
        id: m.id,
        name: m.metadata?.name,
        role: m.metadata?.role,
        skills: m.metadata?.skills,
        building: m.metadata?.building,
        lookingFor: m.metadata?.lookingFor
      }));
  
      const systemPrompt = `
        You are an elite Silicon Valley matchmaker algorithm. 
        Score the compatibility between the 'Searcher' and a list of 'Candidates' from 0 to 100.
        
        RULES FOR SCORING:
        - ASYMMETRY IS KEY: If the Searcher has 'Python/AI' skills and needs a 'Frontend/React' dev, and the Candidate has 'React' skills and needs an 'AI' dev, SCORE = 95+.
        - SYMMETRY IS BAD: If both are AI engineers building similar things and neither needs another AI engineer, SCORE = 30.
        - 0-40: Poor match.
        - 41-74: Okay match.
        - 75-100: Perfect match.
  
        Return ONLY valid JSON. Example: { "matches": [ { "id": "123", "score": 92, "mutual": "They have the React skills you need." } ] }
      `;
  
      const userPrompt = `
        SEARCHER PROFILE:
        Role: ${searcher.role}
        Skills: ${searcher.skills?.join(", ")}
        Building: ${searcher.building}
        Looking For: ${searcher.looking_for}
  
        CANDIDATES:
        ${JSON.stringify(candidateProfiles, null, 2)}
      `;
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
  
      const rawResult = completion.choices[0].message.content || "{}";
      const parsedJson = JSON.parse(rawResult);
      const reRankedData = parsedJson.matches || parsedJson; 
  
      console.log(`🎯 [STAGE 2] GPT Match Scores:`, reRankedData);
  
      let finalMatches = candidateProfiles.map(candidate => {
        const llmEval = Array.isArray(reRankedData) 
          ? reRankedData.find((r: any) => r.id === candidate.id) 
          : { score: 50, mutual: "A potential connection in your network." };
  
        return {
          ...candidate,
          score: llmEval?.score || 0,
          mutual: llmEval?.mutual || "A potential connection in your network."
        };
      });
  
      // 3. Filter out the trash (only keep scores 75+) and sort highest to lowest
      finalMatches = finalMatches
        .filter(match => match.score >= 75)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
  
      console.log(`🏆 [FINAL] Recommended ${finalMatches.length} users over the 75 threshold.`);
  
      return { success: true, matches: finalMatches };
  
    } catch (error: any) {
      console.error("Matchmaking Engine Failed:", error);
      return { success: false, error: error.message };
    }
  }