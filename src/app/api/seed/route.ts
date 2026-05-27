import { NextResponse } from "next/server";
import { getIndex } from "@/lib/db/pinecone";
import { generateEmbedding, buildIntentString } from "@/lib/ai/embedding";

// Highly curated mock data matching the Bangalore AI ecosystem
const MOCK_BUILDERS = [
  {
    userId: "mock_user_001",
    name: "Vikram Mehta",
    role: "AI Engineer",
    company: "AgentStack",
    building: "A framework for deploying multi-agent systems with shared memory and adversarial reasoning.",
    lookingFor: "Next.js developers to build the frontend visualizer for our agent graphs.",
    skills: ["Python", "LangChain", "OpenAI", "Postgres"],
  },
  {
    userId: "mock_user_002",
    name: "Sneha Rao",
    role: "Founder",
    company: "Decisio",
    building: "An Auditable Reasoning Layer for enterprise decisions, acting as a digital supreme court.",
    lookingFor: "Go-to-market strategist who understands high-stakes enterprise AI.",
    skills: ["Product", "Strategy", "Governance", "AI Ethics"],
  },
  {
    userId: "mock_user_003",
    name: "Rahul Nair",
    role: "Fullstack Dev",
    company: "Stealth",
    building: "Vector database optimization tools for Retrieval-Augmented Generation (RAG).",
    lookingFor: "Founders looking for a technical co-founder in the GenAI space.",
    skills: ["TypeScript", "Next.js", "Pinecone", "AWS"],
  },
  {
    userId: "mock_user_004",
    name: "Aditi Sharma",
    role: "Growth Head",
    company: "Versa AI",
    building: "An intent-matching ecosystem for booking local services via AI agents.",
    lookingFor: "Backend engineers familiar with live matching algorithms.",
    skills: ["Growth", "Operations", "B2B Sales"],
  }
];

export async function GET() {
  try {
    const index = getIndex();
    const records = [];

    for (const builder of MOCK_BUILDERS) {
      // 1. Build context string
      const contextualText = buildIntentString(builder.role, builder.building, builder.lookingFor);
      
      // 2. Generate vector embedding
      const embedding = await generateEmbedding(contextualText);
      
      // 3. Format for Pinecone
      records.push({
        id: builder.userId,
        values: embedding,
        metadata: {
          name: builder.name,
          role: builder.role,
          building: builder.building,
          lookingFor: builder.lookingFor,
          company: builder.company,
          skills: builder.skills,
        },
      });
    }

    // 4. Batch upsert to Pinecone
    await index.upsert({ records });

    return NextResponse.json({ 
      success: true, 
      message: "Network successfully seeded with 4 ambitious builders." 
    });

  } catch (error) {
    console.error("Seeding failed:", error);
    return NextResponse.json({ success: false, error: "Failed to seed network" }, { status: 500 });
  }
}