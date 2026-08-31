import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vitanexa.com' },
    update: { password: hashedPassword, role: 'ADMIN', status: 'active', isActive: true },
    create: {
      name: 'Admin User',
      email: 'admin@vitanexa.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@vitanexa.com' },
    update: { password: hashedPassword, role: 'USER', status: 'active', isActive: true },
    create: {
      name: 'Test User',
      email: 'user@vitanexa.com',
      password: hashedPassword,
      role: 'USER',
      isActive: true,
      phone: '+91-9876543210',
    },
  });

  console.log('Users created:', admin.email, user.email);

  const foods = [
    { name: 'Oats', category: 'Grains', fiberContent: '10.6g per 100g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: true, probiotic: false },
    { name: 'Garlic', category: 'Vegetables', fiberContent: '2.1g per 100g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: true, probiotic: false },
    { name: 'Yogurt', category: 'Dairy', fiberContent: '0g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: false, probiotic: true },
    { name: 'Banana', category: 'Fruits', fiberContent: '2.6g per 100g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: true, probiotic: false },
    { name: 'Almonds', category: 'Nuts', fiberContent: '12.5g per 100g', effect: 'ANTI_INFLAMMATORY', prebiotic: false, probiotic: false },
    { name: 'Kimchi', category: 'Fermented', fiberContent: '1.8g per 100g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: false, probiotic: true },
    { name: 'Kefir', category: 'Dairy', fiberContent: '0g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: false, probiotic: true },
    { name: 'Onions', category: 'Vegetables', fiberContent: '1.7g per 100g', effect: 'FEEDS_GOOD_BACTERIA', prebiotic: true, probiotic: false },
    { name: 'Beans', category: 'Legumes', fiberContent: '15g per 100g', effect: 'MAY_CAUSE_BLOATING', prebiotic: true, probiotic: false },
    { name: 'Broccoli', category: 'Vegetables', fiberContent: '2.6g per 100g', effect: 'ANTI_INFLAMMATORY', prebiotic: false, probiotic: false },
  ];

  for (const food of foods) {
    await prisma.foodDatabase.upsert({
      where: { name: food.name },
      update: {},
      create: food,
    });
  }

  console.log('Food database seeded');

  const presets = [
    { name: 'Work', spoonCost: 1, category: 'Work', isDefault: true },
    { name: 'Shower', spoonCost: 1, category: 'Hygiene', isDefault: true },
    { name: 'Cooking', spoonCost: 2, category: 'Household', isDefault: true },
    { name: 'Errand', spoonCost: 3, category: 'Outdoor', isDefault: true },
  ];

  for (const preset of presets) {
    await prisma.activityPreset.create({
      data: { ...preset, userId: user.id },
    });
  }

  console.log('Activity presets seeded');

  const hospitals = [
    {
      name: 'AIIMS Delhi',
      type: 'GOVERNMENT' as const,
      phone: '+91-11-26588500',
      address: 'Ansari Nagar, New Delhi',
      latitude: 28.5672,
      longitude: 77.2100,
      city: 'Delhi',
      state: 'Delhi',
      services: 'Emergency, Surgery, Cardiology, Neurology',
    },
    {
      name: 'Safdarjung Hospital',
      type: 'GOVERNMENT' as const,
      phone: '+91-11-26707444',
      address: 'Safdarjung Enclave, New Delhi',
      latitude: 28.5674,
      longitude: 77.2050,
      city: 'Delhi',
      state: 'Delhi',
      services: 'Emergency, General Medicine, Pediatrics',
    },
  ];

  for (const hospital of hospitals) {
    await prisma.hospital.create({ data: hospital });
  }

  console.log('Hospitals seeded');

  await prisma.supplementInteraction.create({
    data: {
      supplementName: 'Calcium',
      interactsWith: 'Iron',
      effect: 'REDUCES_ABSORPTION',
      severity: 'MODERATE',
      description: 'Calcium can reduce iron absorption. Take at different times of day.',
    },
  });

  console.log('Supplement interaction seeded');


  const bacteriaResults = [
    { userId: user.id, bacteriaName: 'Lactobacillus', level: 'LOW' },
    { userId: user.id, bacteriaName: 'Bifidobacterium', level: 'NORMAL' },
    { userId: user.id, bacteriaName: 'E. coli', level: 'HIGH' },
  ];

  for (const result of bacteriaResults) {
    await prisma.bacteriaResult.create({ data: result });
  }

  console.log('Bacteria results seeded');

  const existingRulesData = [
    {
      bacteriaName: 'Lactobacillus', level: 'LOW',
      clinicalDirection: 'concerning_low',
      foodsToEat: JSON.stringify(['Yogurt', 'Kefir', 'Kimchi', 'Sauerkraut', 'Miso']),
      foodsToAvoid: JSON.stringify(['Processed foods', 'Artificial sweeteners', 'High sugar foods']),
      probiotics: JSON.stringify(['Lactobacillus acidophilus', 'Lactobacillus rhamnosus']),
      prebiotics: JSON.stringify(['Garlic', 'Onions', 'Bananas', 'Oats']),
      shortExplanation: 'Low Lactobacillus levels may indicate recent antibiotic use or inadequate fermented food intake.',
      evidenceGradeOverall: 'B', confidenceScore: 75,
      medicalNotes: 'Common in antibiotic users. Consider probiotic supplementation.',
    },
    {
      bacteriaName: 'Lactobacillus', level: 'NORMAL',
      foodsToEat: JSON.stringify(['Yogurt', 'Kefir', 'Fermented vegetables']),
      foodsToAvoid: JSON.stringify([]), probiotics: JSON.stringify([]), prebiotics: JSON.stringify(['Garlic', 'Onions']),
      shortExplanation: 'Lactobacillus levels are within the normal healthy range.',
      evidenceGradeOverall: 'B', confidenceScore: 80,
      medicalNotes: 'Healthy levels maintained.',
    },
    {
      bacteriaName: 'Lactobacillus', level: 'HIGH',
      clinicalDirection: 'beneficial_high',
      foodsToEat: JSON.stringify(['Leafy greens', 'Fiber-rich vegetables']),
      foodsToAvoid: JSON.stringify(['Excessive probiotics', 'Fermented foods in excess']),
      probiotics: JSON.stringify([]), prebiotics: JSON.stringify([]),
      shortExplanation: 'Elevated Lactobacillus is generally beneficial but very high levels may cause digestive discomfort.',
      evidenceGradeOverall: 'C', confidenceScore: 60,
      medicalNotes: 'Usually not a concern. Monitor for digestive discomfort.',
    },
    {
      bacteriaName: 'Bifidobacterium', level: 'LOW',
      clinicalDirection: 'concerning_low',
      foodsToEat: JSON.stringify(['Garlic', 'Onions', 'Asparagus', 'Leeks', 'Chicory root']),
      foodsToAvoid: JSON.stringify(['High fat diets', 'Low fiber processed foods']),
      probiotics: JSON.stringify(['Bifidobacterium bifidum', 'Bifidobacterium longum']),
      prebiotics: JSON.stringify(['Garlic', 'Onions', 'Bananas', 'Oats', 'Apples']),
      shortExplanation: 'Low Bifidobacterium is linked to inflammation; increase prebiotic fiber intake.',
      evidenceGradeOverall: 'B', confidenceScore: 78,
      medicalNotes: 'Low levels linked to inflammation. Increase prebiotic intake.',
    },
    {
      bacteriaName: 'Bifidobacterium', level: 'NORMAL',
      foodsToEat: JSON.stringify(['Garlic', 'Onions', 'Bananas', 'Oats']),
      foodsToAvoid: JSON.stringify([]), probiotics: JSON.stringify([]), prebiotics: JSON.stringify(['Garlic', 'Onions']),
      shortExplanation: 'Bifidobacterium levels are within the normal healthy range.',
      evidenceGradeOverall: 'B', confidenceScore: 85,
      medicalNotes: 'Healthy levels.',
    },
    {
      bacteriaName: 'Bifidobacterium', level: 'HIGH',
      clinicalDirection: 'beneficial_high',
      foodsToEat: JSON.stringify(['Varied plant-based diet']),
      foodsToAvoid: JSON.stringify(['Excessive inulin supplements']),
      probiotics: JSON.stringify([]), prebiotics: JSON.stringify([]),
      shortExplanation: 'Elevated Bifidobacterium is generally beneficial; maintain a balanced diet.',
      evidenceGradeOverall: 'C', confidenceScore: 65,
      medicalNotes: 'Generally beneficial. Maintain balanced diet.',
    },
    {
      bacteriaName: 'Escherichia coli', level: 'LOW',
      clinicalDirection: 'beneficial_low',
      foodsToEat: JSON.stringify(['Cooked vegetables', 'Bone broth', 'Fermented foods']),
      foodsToAvoid: JSON.stringify(['Raw vegetables (temporary)']),
      probiotics: JSON.stringify([]), prebiotics: JSON.stringify(['Cooked garlic', 'Cooked onions']),
      shortExplanation: 'Low E. coli levels are usually not a concern for healthy individuals.',
      evidenceGradeOverall: 'C', confidenceScore: 55,
      medicalNotes: 'Usually harmless at normal levels.',
    },
    {
      bacteriaName: 'Escherichia coli', level: 'NORMAL',
      foodsToEat: JSON.stringify(['Balanced diet', 'Fiber-rich foods']),
      foodsToAvoid: JSON.stringify([]), probiotics: JSON.stringify([]), prebiotics: JSON.stringify([]),
      shortExplanation: 'E. coli levels are within the normal range for a healthy gut.',
      evidenceGradeOverall: 'C', confidenceScore: 60,
      medicalNotes: 'Normal gut inhabitant.',
    },
    {
      bacteriaName: 'Escherichia coli', level: 'HIGH',
      clinicalDirection: 'concerning_high',
      foodsToEat: JSON.stringify(['Garlic', 'Ginger', 'Turmeric', 'Green tea']),
      foodsToAvoid: JSON.stringify(['Undercooked meat', 'Unwashed vegetables', 'Raw sprouts']),
      probiotics: JSON.stringify(['Lactobacillus rhamnosus GG']), prebiotics: JSON.stringify([]),
      shortExplanation: 'Elevated E. coli may indicate dysbiosis; consult a healthcare provider if symptomatic.',
      evidenceGradeOverall: 'B', confidenceScore: 72,
      medicalNotes: 'May indicate dysbiosis. Consult healthcare provider if symptomatic.',
    },
    {
      bacteriaName: 'Akkermansia', level: 'LOW',
      clinicalDirection: 'concerning_low',
      foodsToEat: JSON.stringify(['Pomegranate', 'Cranberries', 'Green tea', 'Flax seeds']),
      foodsToAvoid: JSON.stringify(['High fat diet', 'Low fiber diet']),
      probiotics: JSON.stringify([]), prebiotics: JSON.stringify(['Pomegranate polyphenols', 'Cranberry extract']),
      shortExplanation: 'Low Akkermansia is associated with metabolic issues; increase polyphenol intake.',
      evidenceGradeOverall: 'A', confidenceScore: 85,
      medicalNotes: 'Low Akkermansia linked to metabolic issues. Increase polyphenol intake.',
    },
    {
      bacteriaName: 'Akkermansia', level: 'NORMAL',
      foodsToEat: JSON.stringify(['Pomegranate', 'Flax seeds', 'Green tea']),
      foodsToAvoid: JSON.stringify([]), probiotics: JSON.stringify([]), prebiotics: JSON.stringify([]),
      shortExplanation: 'Akkermansia levels are in the healthy range associated with good metabolic health.',
      evidenceGradeOverall: 'A', confidenceScore: 82,
      medicalNotes: 'Healthy levels associated with good metabolic health.',
    },
    {
      bacteriaName: 'Akkermansia', level: 'HIGH',
      clinicalDirection: 'beneficial_high',
      foodsToEat: JSON.stringify(['Balanced diet']),
      foodsToAvoid: JSON.stringify([]), probiotics: JSON.stringify([]), prebiotics: JSON.stringify([]),
      shortExplanation: 'Elevated Akkermansia is rare but positive; continue a healthy diet.',
      evidenceGradeOverall: 'C', confidenceScore: 55,
      medicalNotes: 'Rare but positive. Continue healthy diet.',
    },
    {
      bacteriaName: 'Clostridium', level: 'LOW',
      clinicalDirection: 'concerning_low',
      foodsToEat: JSON.stringify(['Garlic', 'Onions', 'Jerusalem artichokes', 'Chicory']),
      foodsToAvoid: JSON.stringify(['Low fiber processed foods']),
      probiotics: JSON.stringify([]), prebiotics: JSON.stringify(['Inulin-rich foods', 'FOS supplements']),
      shortExplanation: 'Some Clostridium species are beneficial but levels should be monitored.',
      evidenceGradeOverall: 'C', confidenceScore: 50,
      medicalNotes: 'Some Clostridium species are beneficial but levels should be monitored.',
    },
    {
      bacteriaName: 'Clostridium', level: 'NORMAL',
      foodsToEat: JSON.stringify(['Fiber-rich diet']),
      foodsToAvoid: JSON.stringify([]), probiotics: JSON.stringify([]), prebiotics: JSON.stringify([]),
      shortExplanation: 'Clostridium levels are within the normal range.',
      evidenceGradeOverall: 'C', confidenceScore: 55,
      medicalNotes: 'Normal levels of beneficial Clostridium species.',
    },
    {
      bacteriaName: 'Clostridium', level: 'HIGH',
      clinicalDirection: 'concerning_high',
      foodsToEat: JSON.stringify(['Garlic', 'Antimicrobial foods', 'Ginger']),
      foodsToAvoid: JSON.stringify(['High sugar foods', 'Processed meats']),
      probiotics: JSON.stringify(['Lactobacillus reuteri', 'Saccharomyces boulardii']), prebiotics: JSON.stringify([]),
      shortExplanation: 'Elevated Clostridium levels may require medical attention if pathogenic strains are present.',
      evidenceGradeOverall: 'B', confidenceScore: 70,
      medicalNotes: 'Elevated levels of pathogenic species may require medical attention.',
    },
  ];

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@vitanexa.com' } });
  if (adminUser) {
    for (const rule of existingRulesData) {
      const data: any = { ...rule, createdBy: adminUser.id, isActive: true };
      if (rule.clinicalDirection === undefined) {
        delete data.clinicalDirection;
      }
      await prisma.microbiomeRule.upsert({
        where: { bacteriaName_level: { bacteriaName: rule.bacteriaName, level: rule.level } },
        update: data,
        create: data,
      });
    }
    console.log('Existing microbiome rules updated');
  }

  const speciesData = [
    { name: 'Akkermansia muciniphila', commonName: 'Akkermansia', priority: 1, isBeneficial: true, description: 'A mucin-degrading bacterium that strengthens gut barrier function and is associated with metabolic health.' },
    { name: 'Faecalibacterium prausnitzii', commonName: 'Faecalibacterium', priority: 1, isBeneficial: true, description: 'A major butyrate-producing bacterium with anti-inflammatory properties, often reduced in IBD patients.' },
    { name: 'Bifidobacterium longum', commonName: null, priority: 1, isBeneficial: true, description: 'A beneficial gut bacterium that ferments prebiotic fibers and supports immune function.' },
    { name: 'Bifidobacterium bifidum', commonName: null, priority: 1, isBeneficial: true, description: 'An early colonizer of the infant gut that metabolizes human milk oligosaccharides.' },
    { name: 'Lactobacillus plantarum', commonName: null, priority: 1, isBeneficial: true, description: 'A versatile lactic acid bacterium found in fermented foods that survives gastrointestinal transit.' },
    { name: 'Lactobacillus rhamnosus', commonName: null, priority: 1, isBeneficial: true, description: 'A well-studied probiotic strain that supports digestive health and immune function.' },
    { name: 'Roseburia intestinalis', commonName: null, priority: 1, isBeneficial: true, description: 'A butyrate-producing bacterium that utilizes dietary fibers and promotes gut health.' },
    { name: 'Eubacterium rectale', commonName: null, priority: 1, isBeneficial: true, description: 'A dominant butyrate-producing bacterium that ferments resistant starch and dietary fiber.' },
    { name: 'Ruminococcus bromii', commonName: null, priority: 1, isBeneficial: true, description: 'A specialist in degrading resistant starch, playing a key role in starch fermentation.' },
    { name: 'Christensenella minuta', commonName: null, priority: 1, isBeneficial: true, description: 'A bacterium associated with low BMI and anti-obesity effects, highly heritable.' },
    { name: 'Bifidobacterium adolescentis', commonName: null, priority: 2, isBeneficial: true, description: 'A predominant Bifidobacterium species in the adult gut that ferments plant-derived carbohydrates.' },
    { name: 'Lactobacillus acidophilus', commonName: null, priority: 2, isBeneficial: true, description: 'A lactic acid bacterium commonly used in probiotics that produces bacteriocins.' },
    { name: 'Lactobacillus casei', commonName: null, priority: 2, isBeneficial: true, description: 'A lactic acid bacterium found in dairy fermentation with immunomodulatory properties.' },
    { name: 'Lactobacillus reuteri', commonName: null, priority: 2, isBeneficial: true, description: 'A probiotic bacterium that produces antimicrobial reuterin and supports oral health.' },
    { name: 'Anaerostipes hadrus', commonName: null, priority: 2, isBeneficial: true, description: 'A butyrate-producing bacterium that utilizes lactate and acetate for butyrate production.' },
    { name: 'Clostridium butyricum', commonName: null, priority: 2, isBeneficial: true, description: 'A spore-forming butyrate-producing bacterium used as a probiotic in some regions.' },
    { name: 'Coprococcus comes', commonName: null, priority: 2, isBeneficial: true, description: 'A butyrate-producing bacterium associated with higher quality of life indicators.' },
    { name: 'Butyricicoccus pullicaecorum', commonName: null, priority: 2, isBeneficial: true, description: 'A butyrate-producing bacterium with potential therapeutic effects in IBD.' },
    { name: 'Bacteroides uniformis', commonName: null, priority: 2, isBeneficial: true, description: 'A polysaccharide-degrading bacterium that modulates host immune responses.' },
    { name: 'Parabacteroides distasonis', commonName: null, priority: 2, isBeneficial: true, description: 'A bile acid-metabolizing bacterium with anti-inflammatory properties.' },
    { name: 'Blautia wexlerae', commonName: null, priority: 3, isBeneficial: true, description: 'A beneficial bacterium associated with reduced inflammation and metabolic health.' },
    { name: 'Prevotella copri', commonName: null, priority: 3, isBeneficial: true, description: 'A plant-polysaccharide degrading bacterium common in high-fiber diets.' },
    { name: 'Subdoligranulum variabile', commonName: null, priority: 3, isBeneficial: true, description: 'A butyrate-producing bacterium associated with healthy gut microbiota.' },
    { name: 'Phascolarctobacterium faecium', commonName: null, priority: 3, isBeneficial: true, description: 'A succinate-utilizing bacterium that produces propionate in the gut.' },
    { name: 'Bacteroides vulgatus', commonName: null, priority: 3, isBeneficial: true, description: 'A common gut bacterium that degrades dietary polysaccharides.' },
    { name: 'Bifidobacterium breve', commonName: null, priority: 3, isBeneficial: true, description: 'A Bifidobacterium species commonly used in probiotics for infant health.' },
    { name: 'Bifidobacterium animalis', commonName: null, priority: 3, isBeneficial: true, description: 'A probiotic Bifidobacterium species with documented digestive health benefits.' },
    { name: 'Lactobacillus gasseri', commonName: null, priority: 3, isBeneficial: true, description: 'A lactic acid bacterium with potential anti-obesity effects in humans.' },
    { name: 'Lactobacillus fermentum', commonName: null, priority: 3, isBeneficial: true, description: 'A lactic acid bacterium with antioxidant and antimicrobial properties.' },
    { name: 'Eubacterium hallii', commonName: null, priority: 3, isBeneficial: true, description: 'A butyrate-producing bacterium that converts lactate to butyrate.' },
    { name: 'Alistipes finegoldii', commonName: null, priority: 4, isBeneficial: true, description: 'A Gram-negative bacterium associated with tryptophan metabolism in the gut.' },
    { name: 'Alistipes putredinis', commonName: null, priority: 4, isBeneficial: true, description: 'A common gut bacterium involved in protein fermentation and amino acid metabolism.' },
    { name: 'Dialister invisus', commonName: null, priority: 4, isBeneficial: true, description: 'A small Gram-negative coccus associated with healthy oral and gut microbiota.' },
    { name: 'Veillonella parvula', commonName: null, priority: 4, isBeneficial: true, description: 'A lactate-utilizing bacterium that produces propionate in the gut.' },
    { name: 'Collinsella aerofaciens', commonName: null, priority: 4, isBeneficial: true, description: 'A hydrogen-utilizing actinobacterium that produces acetate and formate.' },
    { name: 'Ruminococcus obeum', commonName: null, priority: 4, isBeneficial: true, description: 'A mucin-degrading bacterium that modulates pathogen colonization resistance.' },
    { name: 'Ruminococcus torques', commonName: null, priority: 4, isBeneficial: false, description: 'A mucin-degrading bacterium that can be opportunistic in compromised gut environments.' },
    { name: 'Dorea formicigenerans', commonName: null, priority: 4, isBeneficial: true, description: 'A fermentative bacterium that produces formate and hydrogen from carbohydrates.' },
    { name: 'Oscillibacter spp.', commonName: null, priority: 4, isBeneficial: true, description: 'A valerate-producing bacterium associated with reduced cardiovascular risk.' },
    { name: 'Fusicatenibacter saccharivorans', commonName: null, priority: 4, isBeneficial: true, description: 'A butyrate-producing bacterium that degrades complex carbohydrates.' },
    { name: 'Bacteroides ovatus', commonName: null, priority: 5, isBeneficial: true, description: 'A highly adaptable glycan-degrading bacterium that utilizes diverse plant polysaccharides.' },
    { name: 'Bacteroides thetaiotaomicron', commonName: null, priority: 5, isBeneficial: true, description: 'A master glycan degrader that processes dietary and host-derived polysaccharides.' },
    { name: 'Bifidobacterium infantis', commonName: null, priority: 5, isBeneficial: true, description: 'A specialist in metabolizing human milk oligosaccharides in the infant gut.' },
    { name: 'Lactobacillus paracasei', commonName: null, priority: 5, isBeneficial: true, description: 'A versatile lactic acid bacterium used in dairy fermentation and probiotics.' },
    { name: 'Lactobacillus salivarius', commonName: null, priority: 5, isBeneficial: true, description: 'A lactic acid bacterium with antimicrobial activity against oral pathogens.' },
    { name: 'Streptococcus thermophilus', commonName: null, priority: 5, isBeneficial: true, description: 'A thermophilic lactic acid bacterium used in yogurt and cheese production.' },
    { name: 'Leuconostoc mesenteroides', commonName: null, priority: 5, isBeneficial: true, description: 'A heterofermentative lactic acid bacterium used in vegetable fermentations.' },
    { name: 'Pediococcus pentosaceus', commonName: null, priority: 5, isBeneficial: true, description: 'A lactic acid bacterium with bacteriocin production and probiotic potential.' },
    { name: 'Weissella cibaria', commonName: null, priority: 5, isBeneficial: true, description: 'A lactic acid bacterium found in fermented foods with potential probiotic properties.' },
    { name: 'Enterococcus faecium', commonName: null, priority: 5, isBeneficial: false, description: 'A lactic acid bacterium that can be opportunistic in immunocompromised hosts.' },
  ];

  for (const s of speciesData) {
    await prisma.bacteriaSpecies.upsert({
      where: { name: s.name },
      update: {},
      create: { name: s.name, commonName: s.commonName, priority: s.priority, description: s.description, isBeneficial: s.isBeneficial },
    });
  }
  console.log('Bacteria species seeded:', speciesData.length);

  const foodItems = [
    ...['Apple', 'Banana', 'Blueberry', 'Cranberry', 'Pomegranate', 'Strawberry', 'Raspberry', 'Orange', 'Grapefruit', 'Grapes', 'Kiwi', 'Mango', 'Papaya', 'Watermelon', 'Avocado'].map(n => ({ name: n, category: 'FRUITS' as const })),
    ...['Broccoli', 'Spinach', 'Kale', 'Asparagus', 'Artichoke', 'Beetroot', 'Carrot', 'Sweet Potato', 'Onion', 'Garlic', 'Leek', 'Cabbage', 'Cauliflower', 'Brussels Sprouts', 'Celery', 'Cucumber', 'Bell Pepper', 'Mushroom'].map(n => ({ name: n, category: 'VEGETABLES' as const })),
    ...['Chickpeas', 'Lentils', 'Black Beans', 'Kidney Beans', 'Mung Beans', 'Soybeans', 'Peas', 'Edamame'].map(n => ({ name: n, category: 'LEGUMES' as const })),
    ...['Oats', 'Brown Rice', 'Quinoa', 'Barley', 'Rye', 'Buckwheat', 'Millet', 'Whole Wheat'].map(n => ({ name: n, category: 'GRAINS' as const })),
    ...['Almonds', 'Walnuts', 'Flax Seeds', 'Chia Seeds', 'Pumpkin Seeds', 'Sunflower Seeds', 'Sesame Seeds', 'Hemp Seeds', 'Pecans', 'Cashews'].map(n => ({ name: n, category: 'NUTS_SEEDS' as const })),
    ...['Yogurt', 'Kefir', 'Kimchi', 'Sauerkraut', 'Miso', 'Tempeh', 'Kombucha', 'Sourdough', 'Buttermilk', 'Natto'].map(n => ({ name: n, category: 'FERMENTED' as const })),
    ...['Turmeric', 'Ginger', 'Cinnamon', 'Garlic Powder', 'Oregano', 'Rosemary', 'Thyme', 'Cumin', 'Coriander', 'Fennel', 'Cayenne Pepper', 'Black Pepper'].map(n => ({ name: n, category: 'SPICES' as const })),
    ...['Processed Meats', 'Sugary Drinks', 'Artificial Sweeteners', 'High Fructose Corn Syrup', 'White Bread', 'Fried Foods', 'Margarine', 'Trans Fats', 'Refined Sugar', 'Alcohol', 'Red Meat (excess)', 'High Salt Foods'].map(n => ({ name: n, category: 'RISK_FOODS' as const })),
  ];

  const prebioticNames = new Set(['Garlic', 'Onion', 'Leek', 'Asparagus', 'Artichoke', 'Banana', 'Oats', 'Barley', 'Apple', 'Flax Seeds']);
  const probioticNames = new Set(['Yogurt', 'Kefir', 'Kimchi', 'Sauerkraut', 'Miso', 'Tempeh', 'Kombucha', 'Natto', 'Buttermilk']);
  const riskFoodNames = new Set(['Processed Meats', 'Sugary Drinks', 'Artificial Sweeteners', 'High Fructose Corn Syrup', 'White Bread', 'Fried Foods', 'Margarine', 'Trans Fats', 'Refined Sugar', 'Alcohol', 'Red Meat (excess)', 'High Salt Foods']);

  const foodDescriptions: Record<string, string> = {
    Apple: 'A fiber-rich fruit containing pectin and polyphenols that support gut health.',
    Banana: 'A source of resistant starch and prebiotic fibers that feed beneficial gut bacteria.',
    Blueberry: 'A polyphenol-rich berry with anthocyanins that support gut barrier function.',
    Cranberry: 'A tart berry rich in proanthocyanidins that inhibit pathogen adhesion in the gut.',
    Pomegranate: 'A polyphenol-rich fruit whose ellagitannins are metabolized by gut bacteria into urolithins.',
    Strawberry: 'A berry rich in vitamin C and ellagic acid with prebiotic potential.',
    Raspberry: 'A high-fiber berry rich in ellagitannins and ketones that support gut health.',
    Orange: 'A citrus fruit high in vitamin C and pectin that supports digestive health.',
    Grapefruit: 'A citrus fruit containing naringin and fiber that may influence gut microbiota.',
    Grapes: 'A polyphenol-rich fruit containing resveratrol and anthocyanins beneficial for gut health.',
    Kiwi: 'A fiber-rich fruit containing actinidin enzyme that aids digestion.',
    Mango: 'A tropical fruit rich in fiber and polyphenols including mangiferin.',
    Papaya: 'A tropical fruit containing papain enzyme and fiber that supports digestion.',
    Watermelon: 'A hydrating fruit containing lycopene and citrulline with moderate fiber content.',
    Avocado: 'A fiber-rich fruit high in monounsaturated fats that support gut microbial diversity.',
    Broccoli: 'A cruciferous vegetable rich in sulforaphane and fiber that supports gut health.',
    Spinach: 'A leafy green rich in iron and fiber with prebiotic effects on gut bacteria.',
    Kale: 'A nutrient-dense leafy green rich in fiber and sulforaphane precursors.',
    Asparagus: 'A prebiotic-rich vegetable high in inulin that feeds beneficial Bifidobacteria.',
    Artichoke: 'A prebiotic-rich vegetable high in inulin that promotes beneficial gut bacteria.',
    Beetroot: 'A root vegetable rich in betalains and fiber that supports gut and cardiovascular health.',
    Carrot: 'A root vegetable rich in beta-carotene and soluble fiber that supports digestion.',
    'Sweet Potato': 'A starchy root vegetable rich in resistant starch and fiber that feeds gut bacteria.',
    Onion: 'A prebiotic-rich bulb vegetable high in inulin and fructooligosaccharides.',
    Garlic: 'A prebiotic-rich bulb with antimicrobial properties that selectively feeds beneficial bacteria.',
    Leek: 'A prebiotic-rich vegetable high in inulin that supports Bifidobacterium growth.',
    Cabbage: 'A cruciferous vegetable rich in fiber and glucosinolates that support gut health.',
    Cauliflower: 'A cruciferous vegetable rich in fiber and sulfur compounds that aid detoxification.',
    'Brussels Sprouts': 'A cruciferous vegetable rich in fiber and glucosinolates that support gut health.',
    Celery: 'A low-calorie vegetable rich in apigenin and fiber that supports digestive health.',
    Cucumber: 'A hydrating vegetable with moderate fiber content that supports regular digestion.',
    'Bell Pepper': 'A colorful vegetable rich in vitamin C and fiber that supports immune function.',
    Mushroom: 'A fungus rich in beta-glucans that modulate gut microbiota and immune function.',
    Chickpeas: 'A legume rich in resistant starch and fiber that feeds butyrate-producing bacteria.',
    Lentils: 'A high-fiber legume rich in polyphenols and resistant starch that supports gut health.',
    'Black Beans': 'A fiber-rich legume high in resistant starch that promotes butyrate production.',
    'Kidney Beans': 'A legume rich in fiber and resistant starch that supports microbial diversity.',
    'Mung Beans': 'A legume rich in fiber and resistant starch traditionally used for digestive health.',
    Soybeans: 'A protein-rich legume containing isoflavones that are metabolized by gut bacteria.',
    Peas: 'A legume rich in fiber and resistant starch that supports beneficial gut bacteria.',
    Edamame: 'Young soybeans rich in fiber and isoflavones that support gut microbial health.',
    Oats: 'A whole grain rich in beta-glucan that feeds beneficial bacteria and supports heart health.',
    'Brown Rice': 'A whole grain rich in resistant starch and fiber that supports gut health.',
    Quinoa: 'A pseudocereal rich in fiber and prebiotic compounds that support gut bacteria.',
    Barley: 'A whole grain rich in beta-glucan that selectively stimulates beneficial gut bacteria.',
    Rye: 'A whole grain rich in arabinoxylan and fiber that supports microbial diversity.',
    Buckwheat: 'A pseudocereal rich in resistant starch and rutin that supports gut health.',
    Millet: 'A gluten-free grain rich in fiber and prebiotic compounds that support digestion.',
    'Whole Wheat': 'A whole grain rich in arabinoxylan and fiber that feeds beneficial gut bacteria.',
    Almonds: 'A nutrient-dense nut rich in fiber and polyphenols that support gut microbial diversity.',
    Walnuts: 'A polyphenol-rich nut high in omega-3s that support a healthy gut microbiome.',
    'Flax Seeds': 'A fiber-rich seed high in lignans and omega-3s with prebiotic effects.',
    'Chia Seeds': 'A fiber-rich seed that forms gel and supports regular bowel movements.',
    'Pumpkin Seeds': 'A zinc-rich seed with fiber and polyphenols that support gut health.',
    'Sunflower Seeds': 'A vitamin E-rich seed with fiber and polyphenols that support digestion.',
    'Sesame Seeds': 'A calcium-rich seed with lignans and fiber that support gut microbial health.',
    'Hemp Seeds': 'A protein-rich seed with balanced omega-3 and omega-6 fatty acids for gut health.',
    Pecans: 'A polyphenol-rich nut with antioxidants that support gut microbial diversity.',
    Cashews: 'A mineral-rich nut with moderate fiber that supports digestive health.',
    Yogurt: 'A fermented dairy product containing live cultures that support gut health.',
    Kefir: 'A fermented dairy drink containing diverse probiotic bacteria and yeasts.',
    Kimchi: 'A Korean fermented vegetable dish rich in probiotic Lactobacillus bacteria.',
    Sauerkraut: 'A fermented cabbage rich in Lactobacillus and fiber that supports digestion.',
    Miso: 'A fermented soybean paste rich in probiotics and enzymes that aid digestion.',
    Tempeh: 'A fermented soybean cake rich in protein and probiotics that support gut health.',
    Kombucha: 'A fermented tea rich in organic acids and probiotics that support digestion.',
    Sourdough: 'A fermented bread with lactic acid bacteria that improves digestibility.',
    Buttermilk: 'A fermented dairy beverage rich in probiotics and beneficial bacteria.',
    Natto: 'A fermented soybean dish rich in Bacillus subtilis and vitamin K2.',
    Turmeric: 'A polyphenol-rich spice with curcumin that has anti-inflammatory gut effects.',
    Ginger: 'A rhizome with gingerols that support digestion and reduce gut inflammation.',
    Cinnamon: 'A polyphenol-rich spice with prebiotic effects that supports gut health.',
    'Garlic Powder': 'A dehydrated form of garlic with concentrated prebiotic compounds.',
    Oregano: 'An aromatic herb with antimicrobial and anti-inflammatory properties for gut health.',
    Rosemary: 'An aromatic herb with rosmarinic acid that supports digestive health.',
    Thyme: 'An aromatic herb with thymol that has antimicrobial effects in the gut.',
    Cumin: 'A warming spice that supports digestion and may influence gut microbiota.',
    Coriander: 'An aromatic spice with linalool that supports digestive function.',
    Fennel: 'A digestive spice with anethole that reduces bloating and supports gut health.',
    'Cayenne Pepper': 'A spicy pepper with capsaicin that may influence gut motility and microbiota.',
    'Black Pepper': 'A pungent spice with piperine that enhances nutrient absorption and gut health.',
    'Processed Meats': 'Processed meats high in saturated fat and preservatives that may negatively impact gut health.',
    'Sugary Drinks': 'Sugar-sweetened beverages that promote dysbiosis and reduce microbial diversity.',
    'Artificial Sweeteners': 'Non-nutritive sweeteners that may alter gut microbiota composition.',
    'High Fructose Corn Syrup': 'A refined sweetener that promotes intestinal permeability and dysbiosis.',
    'White Bread': 'A refined grain product low in fiber that may negatively impact gut bacteria.',
    'Fried Foods': 'Deep-fried foods high in unhealthy fats that promote gut inflammation.',
    Margarine: 'A processed spread containing trans fats that may disrupt gut microbial balance.',
    'Trans Fats': 'Industrially produced fats that promote inflammation and gut barrier dysfunction.',
    'Refined Sugar': 'Highly processed sugar that feeds pathogenic bacteria and promotes dysbiosis.',
    Alcohol: 'A fermented beverage that in excess disrupts gut barrier function and microbial balance.',
    'Red Meat (excess)': 'Excessive red meat consumption linked to reduced beneficial gut bacteria.',
    'High Salt Foods': 'High sodium intake that may alter gut microbiota and promote inflammation.',
  };

  const fiberValues: Record<string, { sol?: number; insol?: number; polyphenols?: number }> = {
    Apple: { sol: 1.2, insol: 1.3, polyphenols: 120 },
    Banana: { sol: 0.6, insol: 1.8, polyphenols: 40 },
    Blueberry: { sol: 0.6, insol: 1.8, polyphenols: 560 },
    Cranberry: { sol: 0.7, insol: 3.3, polyphenols: 520 },
    Pomegranate: { sol: 0.6, insol: 3.4, polyphenols: 680 },
    Strawberry: { sol: 0.7, insol: 1.3, polyphenols: 340 },
    Raspberry: { sol: 0.8, insol: 5.9, polyphenols: 380 },
    Orange: { sol: 1.0, insol: 1.0, polyphenols: 210 },
    Grapefruit: { sol: 0.8, insol: 0.8, polyphenols: 180 },
    Grapes: { sol: 0.3, insol: 0.5, polyphenols: 250 },
    Kiwi: { sol: 0.5, insol: 2.5, polyphenols: 170 },
    Mango: { sol: 0.7, insol: 1.0, polyphenols: 80 },
    Papaya: { sol: 0.3, insol: 1.4, polyphenols: 50 },
    Watermelon: { sol: 0.2, insol: 0.2, polyphenols: 30 },
    Avocado: { sol: 2.1, insol: 4.6, polyphenols: 100 },
    Broccoli: { sol: 1.2, insol: 1.4, polyphenols: 150 },
    Spinach: { sol: 0.7, insol: 1.5, polyphenols: 180 },
    Kale: { sol: 0.8, insol: 1.2, polyphenols: 270 },
    Asparagus: { sol: 0.7, insol: 1.3, polyphenols: 70 },
    Artichoke: { sol: 2.5, insol: 3.5, polyphenols: 260 },
    Beetroot: { sol: 0.9, insol: 1.9, polyphenols: 180 },
    Carrot: { sol: 1.0, insol: 1.8, polyphenols: 60 },
    'Sweet Potato': { sol: 0.8, insol: 2.2, polyphenols: 40 },
    Onion: { sol: 1.1, insol: 0.6, polyphenols: 100 },
    Garlic: { sol: 0.5, insol: 0.6, polyphenols: 30 },
    Leek: { sol: 0.9, insol: 0.7, polyphenols: 50 },
    Cabbage: { sol: 0.7, insol: 0.8, polyphenols: 80 },
    Cauliflower: { sol: 0.5, insol: 1.5, polyphenols: 60 },
    'Brussels Sprouts': { sol: 1.2, insol: 1.8, polyphenols: 130 },
    Celery: { sol: 0.6, insol: 0.4, polyphenols: 40 },
    Cucumber: { sol: 0.2, insol: 0.3, polyphenols: 20 },
    'Bell Pepper': { sol: 0.3, insol: 0.7, polyphenols: 120 },
    Mushroom: { sol: 0.1, insol: 0.9, polyphenols: 30 },
    Chickpeas: { sol: 1.3, insol: 6.0, polyphenols: 100 },
    Lentils: { sol: 0.9, insol: 5.8, polyphenols: 130 },
    'Black Beans': { sol: 1.4, insol: 6.5, polyphenols: 170 },
    'Kidney Beans': { sol: 1.5, insol: 5.8, polyphenols: 140 },
    'Mung Beans': { sol: 0.8, insol: 5.4, polyphenols: 60 },
    Soybeans: { sol: 1.2, insol: 5.0, polyphenols: 160 },
    Peas: { sol: 0.6, insol: 3.6, polyphenols: 30 },
    Edamame: { sol: 0.7, insol: 4.0, polyphenols: 120 },
    Oats: { sol: 2.2, insol: 4.4, polyphenols: 50 },
    'Brown Rice': { sol: 0.4, insol: 1.6, polyphenols: 20 },
    Quinoa: { sol: 0.8, insol: 2.2, polyphenols: 60 },
    Barley: { sol: 2.0, insol: 5.0, polyphenols: 45 },
    Rye: { sol: 2.5, insol: 4.5, polyphenols: 30 },
    Buckwheat: { sol: 0.7, insol: 3.3, polyphenols: 100 },
    Millet: { sol: 0.3, insol: 1.5, polyphenols: 10 },
    'Whole Wheat': { sol: 0.8, insol: 4.0, polyphenols: 35 },
    Almonds: { sol: 1.1, insol: 11.4, polyphenols: 190 },
    Walnuts: { sol: 1.0, insol: 5.5, polyphenols: 300 },
    'Flax Seeds': { sol: 2.8, insol: 24.5, polyphenols: 250 },
    'Chia Seeds': { sol: 2.0, insol: 32.0, polyphenols: 80 },
    'Pumpkin Seeds': { sol: 1.0, insol: 4.0, polyphenols: 40 },
    'Sunflower Seeds': { sol: 1.5, insol: 7.0, polyphenols: 100 },
    'Sesame Seeds': { sol: 1.5, insol: 10.0, polyphenols: 180 },
    'Hemp Seeds': { sol: 0.5, insol: 3.0, polyphenols: 30 },
    Pecans: { sol: 1.5, insol: 7.5, polyphenols: 240 },
    Cashews: { sol: 0.5, insol: 2.5, polyphenols: 40 },
    Turmeric: { sol: 0.3, insol: 1.5, polyphenols: 1500 },
    Ginger: { sol: 0.4, insol: 1.6, polyphenols: 250 },
    Cinnamon: { sol: 1.5, insol: 5.0, polyphenols: 900 },
    'Garlic Powder': { sol: 1.0, insol: 1.5, polyphenols: 60 },
    Oregano: { sol: 2.0, insol: 10.0, polyphenols: 1200 },
    Rosemary: { sol: 2.0, insol: 8.0, polyphenols: 1000 },
    Thyme: { sol: 1.5, insol: 5.0, polyphenols: 850 },
    Cumin: { sol: 1.5, insol: 8.0, polyphenols: 700 },
    Coriander: { sol: 0.5, insol: 2.5, polyphenols: 200 },
    Fennel: { sol: 0.8, insol: 3.0, polyphenols: 150 },
    'Cayenne Pepper': { sol: 1.0, insol: 3.0, polyphenols: 300 },
    'Black Pepper': { sol: 1.0, insol: 4.0, polyphenols: 350 },
  };

  const foodItemNames = foodItems.map(f => f.name);
  const highFiberCategories = new Set(['VEGETABLES', 'LEGUMES', 'GRAINS']);
  const highFiberFoods = new Set(foodItems.filter(f => highFiberCategories.has(f.category)).map(f => f.name));
  const fermentedFoods = new Set(foodItems.filter(f => f.category === 'FERMENTED').map(f => f.name));
  const polyphenolRichFoods = new Set(['Blueberry', 'Cranberry', 'Pomegranate', 'Strawberry', 'Raspberry']);

  const isButyrateProducer = (name: string) =>
    ['Faecalibacterium prausnitzii', 'Roseburia intestinalis', 'Eubacterium rectale', 'Eubacterium hallii',
     'Anaerostipes hadrus', 'Coprococcus comes', 'Butyricicoccus pullicaecorum', 'Clostridium butyricum',
     'Subdoligranulum variabile'].includes(name);

  const isBifidobacterium = (name: string) =>
    ['Bifidobacterium longum', 'Bifidobacterium bifidum', 'Bifidobacterium adolescentis',
     'Bifidobacterium breve', 'Bifidobacterium animalis', 'Bifidobacterium infantis'].includes(name);

  const isLactobacillus = (name: string) =>
    ['Lactobacillus plantarum', 'Lactobacillus rhamnosus', 'Lactobacillus acidophilus',
     'Lactobacillus casei', 'Lactobacillus reuteri', 'Lactobacillus gasseri',
     'Lactobacillus fermentum', 'Lactobacillus paracasei', 'Lactobacillus salivarius'].includes(name);

  const isOpportunistic = (name: string) =>
    ['Ruminococcus torques', 'Enterococcus faecium'].includes(name);

  for (const f of foodItems) {
    const desc = foodDescriptions[f.name] || `A ${f.category.toLowerCase().replace('_', ' ')} item that contributes to dietary diversity.`;
    const fibers = fiberValues[f.name] || {};
    await prisma.foodItem.upsert({
      where: { name: f.name },
      update: {},
      create: {
        name: f.name,
        category: f.category,
        description: desc,
        solubleFiber: fibers.sol ?? undefined,
        insolubleFiber: fibers.insol ?? undefined,
        polyphenols: fibers.polyphenols ?? undefined,
        isPrebiotic: prebioticNames.has(f.name),
        isProbiotic: probioticNames.has(f.name),
        isRiskFood: riskFoodNames.has(f.name),
      },
    });
  }
  console.log('Food items seeded:', foodItems.length);

  const allSpecies = await prisma.bacteriaSpecies.findMany();
  const allFoodItems = await prisma.foodItem.findMany();
  const speciesMap = new Map(allSpecies.map(s => [s.name, s]));
  const foodMap = new Map(allFoodItems.map(f => [f.name, f]));

  const foodEffectTracking = new Map<string, { increase: Set<string>; decrease: Set<string> }>();
  for (const s of allSpecies) {
    foodEffectTracking.set(s.name, { increase: new Set(), decrease: new Set() });
  }

  const specificEffects: [string, string, string, string, string, string][] = [
    ['Akkermansia muciniphila', 'Pomegranate', 'STRONGLY_INCREASES', 'A', 'human_species_specific', 'Polyphenol metabolism via mucin degradation'],
    ['Akkermansia muciniphila', 'Cranberry', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Polyphenol metabolism via mucin degradation'],
    ['Akkermansia muciniphila', 'Flax Seeds', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Polyphenol metabolism via mucin degradation'],
    ['Faecalibacterium prausnitzii', 'Oats', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Beta-glucan fermentation'],
    ['Faecalibacterium prausnitzii', 'Barley', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Beta-glucan fermentation'],
    ['Faecalibacterium prausnitzii', 'Broccoli', 'MODERATELY_INCREASES', 'C', 'observational_only', 'Dietary fiber fermentation'],
    ['Faecalibacterium prausnitzii', 'Onion', 'MODERATELY_INCREASES', 'C', 'observational_only', 'Prebiotic fiber fermentation'],
    ['Lactobacillus plantarum', 'Sauerkraut', 'MODERATELY_INCREASES', 'A', 'human_species_specific', 'Direct probiotic supplementation'],
    ['Lactobacillus plantarum', 'Kimchi', 'MODERATELY_INCREASES', 'A', 'human_species_specific', 'Direct probiotic supplementation'],
    ['Bifidobacterium longum', 'Garlic', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Prebiotic FOS metabolism'],
    ['Bifidobacterium longum', 'Onion', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Prebiotic FOS metabolism'],
    ['Bifidobacterium longum', 'Asparagus', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Prebiotic FOS metabolism'],
    ['Bifidobacterium longum', 'Banana', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Prebiotic FOS metabolism'],
    ['Roseburia intestinalis', 'Oats', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Resistant starch fermentation'],
    ['Roseburia intestinalis', 'Barley', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Resistant starch fermentation'],
    ['Roseburia intestinalis', 'Brown Rice', 'MODERATELY_INCREASES', 'C', 'observational_only', 'Whole grain fermentation'],
    ['Eubacterium rectale', 'Banana', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Resistant starch fermentation'],
    ['Eubacterium rectale', 'Oats', 'MODERATELY_INCREASES', 'B', 'human_genus_level', 'Resistant starch fermentation'],
    ['Eubacterium rectale', 'Lentils', 'MODERATELY_INCREASES', 'C', 'observational_only', 'Legume resistant starch fermentation'],
  ];

  const processedEffects = new Set<string>();

  for (const [speciesName, foodName, effect, grade, basis, mechanism] of specificEffects) {
    const species = speciesMap.get(speciesName);
    const food = foodMap.get(foodName);
    if (!species || !food) {
      console.warn(`Skipping specific effect: ${speciesName} x ${foodName} - not found in DB`);
      continue;
    }
    await prisma.foodBacteriaEffect.upsert({
      where: { speciesId_foodId: { speciesId: species.id, foodId: food.id } },
      update: { effect, evidenceGrade: grade, evidenceBasis: basis, mechanism, reviewStatus: 'published' },
      create: { speciesId: species.id, foodId: food.id, effect, evidenceGrade: grade, evidenceBasis: basis, mechanism, reviewStatus: 'published' },
    });
    processedEffects.add(`${species.id}:${food.id}`);
    const tracker = foodEffectTracking.get(speciesName)!;
    if (effect.includes('INCREASES')) tracker.increase.add(foodName);
    if (effect.includes('DECREASES')) tracker.decrease.add(foodName);
  }

  for (const species of allSpecies) {
    const tracker = foodEffectTracking.get(species.name)!;
    for (const food of allFoodItems) {
      if (processedEffects.has(`${species.id}:${food.id}`)) continue;

      let effect = 'NEUTRAL';
      let grade: string | undefined;
      let basis: string | undefined;
      let mechanism: string | undefined;

      const isOpp = isOpportunistic(species.name);
      const isBifi = isBifidobacterium(species.name);
      const isLacto = isLactobacillus(species.name);
      const isButy = isButyrateProducer(species.name);
      const isAkka = species.name === 'Akkermansia muciniphila';

      if (prebioticNames.has(food.name) && (isBifi || isLacto)) {
        effect = 'MODERATELY_INCREASES'; grade = 'B'; basis = 'human_genus_level'; mechanism = 'Prebiotic fiber fermentation';
      } else if (probioticNames.has(food.name) && (isLacto || isBifi)) {
        effect = 'MODERATELY_INCREASES'; grade = 'A'; basis = 'human_species_specific'; mechanism = 'Direct probiotic supplementation';
      } else if (riskFoodNames.has(food.name) && isOpp) {
        effect = 'STRONGLY_INCREASES'; grade = 'C'; basis = 'observational_only'; mechanism = 'Dietary risk factor associated with dysbiosis';
      } else if (riskFoodNames.has(food.name) && species.isBeneficial) {
        effect = 'MODERATELY_DECREASES'; grade = 'C'; basis = 'observational_only'; mechanism = 'Dietary risk factor associated with dysbiosis';
      } else if (highFiberFoods.has(food.name) && isButy) {
        effect = 'SLIGHTLY_INCREASES'; grade = 'C'; basis = 'observational_only'; mechanism = 'Dietary fiber fermentation to short-chain fatty acids';
      } else if (polyphenolRichFoods.has(food.name) && isAkka) {
        effect = 'SLIGHTLY_INCREASES'; grade = 'B'; basis = 'human_genus_level'; mechanism = 'Polyphenol metabolism';
      } else if (fermentedFoods.has(food.name) && (isLacto || isBifi || isButy)) {
        effect = 'SLIGHTLY_INCREASES'; grade = 'C'; basis = 'observational_only'; mechanism = 'Fermented food consumption';
      } else if (fermentedFoods.has(food.name) && isOpp) {
        effect = 'SLIGHTLY_DECREASES'; grade = 'C'; basis = 'observational_only'; mechanism = 'Fermented food antimicrobial effects';
      } else if (prebioticNames.has(food.name) && isOpp) {
        continue;
      } else {
        continue;
      }

      await prisma.foodBacteriaEffect.upsert({
        where: { speciesId_foodId: { speciesId: species.id, foodId: food.id } },
        update: { effect, evidenceGrade: grade, evidenceBasis: basis, mechanism, reviewStatus: 'published' },
        create: { speciesId: species.id, foodId: food.id, effect, evidenceGrade: grade, evidenceBasis: basis, mechanism, reviewStatus: 'published' },
      });

      if (effect.includes('INCREASES')) tracker.increase.add(food.name);
      if (effect.includes('DECREASES')) tracker.decrease.add(food.name);
    }
  }

  console.log('Food-bacteria effects generated');

  const highFatRiskFoods = ['Fried Foods', 'Processed Meats', 'Margarine', 'Trans Fats', 'Red Meat (excess)'];

  for (const [speciesName, foodName, effect, grade, basis, mechanism] of [
    ['Akkermansia muciniphila', 'Fried Foods', 'MODERATELY_DECREASES', 'C', 'observational_only', 'High-fat diet reduces Akkermansia abundance'],
    ['Akkermansia muciniphila', 'Processed Meats', 'MODERATELY_DECREASES', 'C', 'observational_only', 'High-fat diet reduces Akkermansia abundance'],
    ['Akkermansia muciniphila', 'Margarine', 'MODERATELY_DECREASES', 'C', 'observational_only', 'High-fat diet reduces Akkermansia abundance'],
    ['Akkermansia muciniphila', 'Red Meat (excess)', 'MODERATELY_DECREASES', 'C', 'observational_only', 'High-fat diet reduces Akkermansia abundance'],
  ] as [string, string, string, string, string, string][]) {
    const species = speciesMap.get(speciesName);
    const food = foodMap.get(foodName);
    if (!species || !food) continue;
    await prisma.foodBacteriaEffect.upsert({
      where: { speciesId_foodId: { speciesId: species.id, foodId: food.id } },
      update: { effect, evidenceGrade: grade, evidenceBasis: basis, mechanism, reviewStatus: 'published' },
      create: { speciesId: species.id, foodId: food.id, effect, evidenceGrade: grade, evidenceBasis: basis, mechanism, reviewStatus: 'published' },
    });
    const tracker = foodEffectTracking.get(speciesName)!;
    if (effect.includes('DECREASES')) tracker.decrease.add(foodName);
  }

  console.log('Akkermansia specific effects seeded');

  if (adminUser) {
    const levels = ['LOW', 'NORMAL', 'HIGH'] as const;
    const speciesDataMap = new Map(speciesData.map(s => [s.name, s]));

    for (const species of allSpecies) {
      const tracker = foodEffectTracking.get(species.name)!;
      const speciesInfo = speciesDataMap.get(species.name);
      const isBeneficial = speciesInfo?.isBeneficial ?? true;
      const isBifi = isBifidobacterium(species.name);
      const isLacto = isLactobacillus(species.name);
      const isOpp = isOpportunistic(species.name);

      for (const level of levels) {
        let clinicalDirection: string | undefined;
        if (level === 'LOW') {
          clinicalDirection = isBeneficial ? 'concerning_low' : 'beneficial_low';
        } else if (level === 'HIGH') {
          clinicalDirection = isBeneficial ? 'beneficial_high' : 'concerning_high';
        }

        const eatArr = Array.from(tracker.increase);
        const avoidArr = Array.from(tracker.decrease);

        const probiotics: string[] = [];
        if (isLacto) {
          if (species.name === 'Lactobacillus rhamnosus') probiotics.push('Lactobacillus rhamnosus GG');
          else if (species.name === 'Lactobacillus plantarum') probiotics.push('Lactobacillus plantarum 299v');
          else if (species.name === 'Lactobacillus acidophilus') probiotics.push('Lactobacillus acidophilus NCFM');
          else if (species.name === 'Lactobacillus casei') probiotics.push('Lactobacillus casei Shirota');
          else if (species.name === 'Lactobacillus reuteri') probiotics.push('Lactobacillus reuteri DSM 17938');
          else probiotics.push(species.name);
        }
        if (isBifi) {
          if (species.name === 'Bifidobacterium longum') probiotics.push('Bifidobacterium longum BB536');
          else if (species.name === 'Bifidobacterium bifidum') probiotics.push('Bifidobacterium bifidum BGN4');
          else if (species.name === 'Bifidobacterium breve') probiotics.push('Bifidobacterium breve M-16V');
          else if (species.name === 'Bifidobacterium infantis') probiotics.push('Bifidobacterium infantis 35624');
          else probiotics.push(species.name);
        }

        const prebioticList: string[] = [];
        if (isBifi || isLacto) {
          prebioticList.push('Inulin', 'FOS');
          if (species.name === 'Bifidobacterium longum') prebioticList.push('Fructooligosaccharides');
        }

        let explanation: string;
        let evidenceGrade: string;
        let confidence: number;

        if (level === 'NORMAL') {
          explanation = `${species.name} levels are within the normal range for a healthy gut.`;
          evidenceGrade = isBeneficial ? 'B' : 'C';
          confidence = isOpp ? 55 : 80;
        } else if (level === 'LOW') {
          if (isBeneficial) {
            explanation = `Low ${species.name} may indicate reduced beneficial activity; consider increasing ${eatArr.length > 0 ? 'prebiotic and fiber-rich foods' : 'dietary fiber'} intake.`;
          } else {
            explanation = `Low levels of ${species.name} are generally favorable and not a cause for concern.`;
          }
          evidenceGrade = isOpp ? 'C' : 'B';
          confidence = isOpp ? 50 : 70;
        } else {
          if (isBeneficial) {
            explanation = `Elevated ${species.name} is generally beneficial for gut health.`;
          } else {
            explanation = `Elevated ${species.name} may indicate dysbiosis; consider reducing risk foods.`;
          }
          evidenceGrade = isOpp ? 'B' : 'C';
          confidence = isOpp ? 65 : 60;
        }

        const ruleId = `${species.name}_${level}`;
        const existingRule = existingRulesData.find(r => `${r.bacteriaName}_${r.level}` === ruleId);

        await prisma.microbiomeRule.upsert({
          where: { bacteriaName_level: { bacteriaName: species.name, level } },
          update: {
            speciesId: species.id,
            clinicalDirection,
            foodsToEat: JSON.stringify(eatArr),
            foodsToAvoid: JSON.stringify(avoidArr),
            probiotics: JSON.stringify(Array.from(new Set(probiotics))),
            prebiotics: JSON.stringify(Array.from(new Set(prebioticList))),
            shortExplanation: explanation,
            evidenceGradeOverall: evidenceGrade,
            confidenceScore: confidence,
            isActive: true,
            createdBy: adminUser.id,
          },
          create: {
            bacteriaName: species.name,
            level,
            speciesId: species.id,
            clinicalDirection,
            foodsToEat: JSON.stringify(eatArr),
            foodsToAvoid: JSON.stringify(avoidArr),
            probiotics: JSON.stringify(Array.from(new Set(probiotics))),
            prebiotics: JSON.stringify(Array.from(new Set(prebioticList))),
            shortExplanation: explanation,
            evidenceGradeOverall: evidenceGrade,
            confidenceScore: confidence,
            isActive: true,
            createdBy: adminUser.id,
          },
        });
      }
    }
    console.log('Microbiome rules seeded for all species');

    for (const species of allSpecies) {
      const isBeneficial = speciesDataMap.get(species.name)?.isBeneficial ?? true;
      const priority = speciesDataMap.get(species.name)?.priority ?? 5;
      const isOpp = isOpportunistic(species.name);

      let bh: number, bl: number, ch: number, cl: number;

      if (isOpp) {
        bh = -10; bl = 5; ch = -15; cl = 0;
      } else if (priority === 1) {
        bh = 15; bl = -15; ch = 0; cl = -10;
      } else if (priority === 2) {
        bh = 12; bl = -12; ch = 0; cl = -8;
      } else if (priority === 3) {
        bh = 10; bl = -10; ch = 0; cl = -8;
      } else if (priority === 4) {
        bh = 8; bl = -8; ch = 0; cl = -6;
      } else {
        bh = 8; bl = -8; ch = 0; cl = -6;
      }

      await prisma.microbiomeHealthScoreWeight.upsert({
        where: { speciesId: species.id },
        update: {
          beneficialHighWeight: bh,
          beneficialLowWeight: bl,
          concerningHighWeight: ch,
          concerningLowWeight: cl,
          diversityWeight: 5,
        },
        create: {
          speciesId: species.id,
          beneficialHighWeight: bh,
          beneficialLowWeight: bl,
          concerningHighWeight: ch,
          concerningLowWeight: cl,
          diversityWeight: 5,
        },
      });
    }
    console.log('Health score weights seeded');
  }

  // === Nutrient Absorber Optimizer seed data ===
  const interactions = [
    { supplementName: 'Vitamin D', interactsWith: 'fat_present', effect: 'IMPROVES_ABSORPTION', severity: 'LOW', description: 'Fat-soluble vitamins like Vitamin D absorb better when taken with dietary fat.', suggestedTimingFix: 'take with a meal containing fat', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'food_tag' },
    { supplementName: 'Vitamin D', interactsWith: 'Iron', effect: 'REDUCES_ABSORPTION', severity: 'MEDIUM', description: 'High doses of Vitamin D may interfere with iron metabolism.', suggestedTimingFix: 'space by 2 hours', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'supplement' },
    { supplementName: 'Calcium', interactsWith: 'Iron', effect: 'REDUCES_ABSORPTION', severity: 'MEDIUM', description: 'Calcium competes with iron for absorption in the digestive tract.', suggestedTimingFix: 'space by at least 2 hours', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'supplement' },
    { supplementName: 'Iron', interactsWith: 'Caffeine', effect: 'REDUCES_ABSORPTION', severity: 'MEDIUM', description: 'Caffeine and tannins can bind to iron and reduce its absorption.', suggestedTimingFix: 'avoid within 1-2 hours of iron', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'food_tag' },
    { supplementName: 'Iron', interactsWith: 'Calcium', effect: 'REDUCES_ABSORPTION', severity: 'MEDIUM', description: 'Calcium can inhibit iron absorption when taken together.', suggestedTimingFix: 'space by at least 2 hours', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'supplement' },
    { supplementName: 'Iron', interactsWith: 'vitamin_C', effect: 'IMPROVES_ABSORPTION', severity: 'LOW', description: 'Vitamin C significantly enhances non-heme iron absorption.', suggestedTimingFix: 'take with Vitamin C-rich food or supplement', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'food_tag' },
    { supplementName: 'Magnesium', interactsWith: 'Calcium', effect: 'REDUCES_ABSORPTION', severity: 'LOW', description: 'Calcium and magnesium compete for absorption. Taking them together may reduce absorption of both.', suggestedTimingFix: 'space by 2 hours or take at different meals', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'supplement' },
    { supplementName: 'Zinc', interactsWith: 'Iron', effect: 'REDUCES_ABSORPTION', severity: 'MEDIUM', description: 'Zinc and iron compete for absorption when taken together in high doses.', suggestedTimingFix: 'space by 2 hours', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'supplement' },
    { supplementName: 'Omega-3', interactsWith: 'fat_present', effect: 'IMPROVES_ABSORPTION', severity: 'LOW', description: 'Omega-3 fatty acids are better absorbed when taken with dietary fat.', suggestedTimingFix: 'take with a meal containing fat', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'food_tag' },
    { supplementName: 'Vitamin B12', interactsWith: 'vitamin_C', effect: 'REDUCES_ABSORPTION', severity: 'LOW', description: 'High-dose Vitamin C may degrade Vitamin B12 in the digestive tract.', suggestedTimingFix: 'space by 1-2 hours', citationUrl: 'https://pubmed.ncbi.nlm.nih.gov/', itemBType: 'food_tag' },
  ];

  for (const interaction of interactions) {
    await prisma.supplementInteraction.upsert({
      where: { supplementName_interactsWith: { supplementName: interaction.supplementName, interactsWith: interaction.interactsWith } },
      update: interaction,
      create: interaction,
    });
  }
  console.log('Supplement interactions seeded:', interactions.length);

  const rdiData = [
    { nutrient: 'vitamin_d', rdiValue: 600, rdiUnit: 'IU', populationNotes: 'Adults 19-70 (800 IU for 70+)', sourceReference: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
    { nutrient: 'magnesium', rdiValue: 420, rdiUnit: 'mg', populationNotes: 'Adult men 19-51 (320 mg for women)', sourceReference: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/' },
    { nutrient: 'iron', rdiValue: 8, rdiUnit: 'mg', populationNotes: 'Adult men (18 mg for women 19-50)', sourceReference: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
    { nutrient: 'omega3', rdiValue: 1.6, rdiUnit: 'g', populationNotes: 'Adult men (1.1 g for women)', sourceReference: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/' },
    { nutrient: 'b12', rdiValue: 2.4, rdiUnit: 'ug', populationNotes: 'Adults 14+', sourceReference: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
    { nutrient: 'calcium', rdiValue: 1000, rdiUnit: 'mg', populationNotes: 'Adults 19-50 (1200 mg for women 51+)', sourceReference: 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/' },
    { nutrient: 'zinc', rdiValue: 11, rdiUnit: 'mg', populationNotes: 'Adult men 19+ (8 mg for women)', sourceReference: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
    { nutrient: 'vitamin_c', rdiValue: 90, rdiUnit: 'mg', populationNotes: 'Adult men (75 mg for women)', sourceReference: 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/' },
  ];

  for (const rdi of rdiData) {
    await prisma.rdiReference.upsert({
      where: { nutrient: rdi.nutrient },
      update: rdi,
      create: rdi,
    });
  }
  console.log('RDI references seeded:', rdiData.length);

  console.log('Seed complete!');
  console.log('Admin login: admin@vitanexa.com / password123');
  console.log('User login: user@vitanexa.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
