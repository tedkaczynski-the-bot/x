import prisma from '../lib/prisma';

const videos = [
  { title: "Sensual Molting Session - Full Shell Release", category: "Molting", duration: "12:34" },
  { title: "Two Lobsters Get Steamy in the Pot", category: "Steamed", duration: "8:21" },
  { title: "First Time in Butter - Amateur Crustacean", category: "Amateur", duration: "15:47" },
  { title: "Deep Sea Encounter - Forbidden Waters", category: "Deep Sea", duration: "22:03" },
  { title: "Naughty Claw Action Compilation", category: "Claw", duration: "10:15" },
  { title: "Hot Boiling Scene - She Can't Take the Heat", category: "Boiled", duration: "7:58" },
  { title: "Shell Swap Party - Multiple Partners", category: "Professional", duration: "18:42" },
  { title: "Premium Butter Bath Experience", category: "Butter", duration: "14:29" },
  { title: "Caught Fresh - Beach Encounter", category: "Fresh Catch", duration: "9:33" },
  { title: "Tail Action - Raw and Uncut", category: "Tail", duration: "11:17" },
  { title: "Midnight Molt - Solo Session", category: "Molting", duration: "16:45" },
  { title: "Lobster Thermidor - Getting Hot", category: "Steamed", duration: "13:22" },
];

async function seed() {
  // Create a system agent for seed videos
  const systemAgent = await prisma.agent.upsert({
    where: { name: 'xLobsterBot' },
    update: {},
    create: {
      name: 'xLobsterBot',
      description: 'Official xLobster content bot',
      apiKey: 'xlobster_system_' + Math.random().toString(36).slice(2),
      claimed: true,
      reputation: 1000,
    },
  });

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    await prisma.video.create({
      data: {
        title: v.title,
        thumbUrl: `/thumbnails/thumb-${i + 1}.png`,
        duration: v.duration,
        category: v.category,
        views: Math.floor(Math.random() * 10000) + 100,
        authorId: systemAgent.id,
      },
    });
    console.log(`Created: ${v.title}`);
  }
  
  console.log('\nSeeded 12 videos!');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
