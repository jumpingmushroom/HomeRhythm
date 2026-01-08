import { getDatabase } from './index';

export function seedTemplates() {
  const db = getDatabase();

  const templates = [
    // Exterior
    {
      title: 'Clean gutters',
      description: 'Remove leaves and debris from gutters and downspouts',
      category: 'exterior',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Power wash exterior',
      description: 'Clean siding, deck, and driveway',
      category: 'exterior',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Inspect roof',
      description: 'Check for damaged or missing shingles',
      category: 'exterior',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Seal driveway',
      description: 'Apply sealant to asphalt driveway',
      category: 'exterior',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ season: 'summer' }),
    },
    {
      title: 'Winterize outdoor faucets',
      description: 'Drain and cover outdoor water spigots',
      category: 'plumbing',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },

    // HVAC
    {
      title: 'Replace HVAC filters',
      description: 'Change air filters for heating and cooling system',
      category: 'hvac',
      recurrence_type: 'monthly',
      recurrence_interval: 3,
      recurrence_config: null,
    },
    {
      title: 'Service HVAC system',
      description: 'Professional maintenance of heating and cooling system',
      category: 'hvac',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Clean furnace',
      description: 'Clean burners and check furnace operation',
      category: 'hvac',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Service heat pump',
      description: 'Professional heat pump inspection and servicing',
      category: 'hvac',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },

    // Appliances
    {
      title: 'Clean dryer vent',
      description: 'Remove lint buildup from dryer exhaust vent',
      category: 'appliances',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: null,
    },
    {
      title: 'Clean refrigerator coils',
      description: 'Vacuum condenser coils on refrigerator',
      category: 'appliances',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: null,
    },
    {
      title: 'Replace water filter',
      description: 'Change refrigerator or whole-house water filter',
      category: 'appliances',
      recurrence_type: 'monthly',
      recurrence_interval: 6,
      recurrence_config: null,
    },
    {
      title: 'Clean dishwasher filter',
      description: 'Remove and clean dishwasher filter and spray arms',
      category: 'appliances',
      recurrence_type: 'monthly',
      recurrence_interval: 3,
      recurrence_config: null,
    },

    // Garden
    {
      title: 'Fertilize lawn',
      description: 'Apply seasonal fertilizer to lawn',
      category: 'garden',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Aerate lawn',
      description: 'Core aeration of lawn for better water and nutrient absorption',
      category: 'garden',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Prune trees and shrubs',
      description: 'Trim back overgrown branches',
      category: 'garden',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Mulch garden beds',
      description: 'Apply fresh mulch to garden beds',
      category: 'garden',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Winterize sprinkler system',
      description: 'Blow out irrigation lines and shut off water',
      category: 'garden',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },

    // Plumbing
    {
      title: 'Test sump pump',
      description: 'Pour water into sump pit to test pump operation',
      category: 'plumbing',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Flush water heater',
      description: 'Drain sediment from water heater tank',
      category: 'plumbing',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: null,
    },
    {
      title: 'Check for leaks',
      description: 'Inspect under sinks, around toilets, and exposed pipes',
      category: 'plumbing',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: null,
    },

    // Electrical
    {
      title: 'Test GFCI outlets',
      description: 'Press test button on all GFCI outlets',
      category: 'electrical',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: null,
    },
    {
      title: 'Test smoke detectors',
      description: 'Test all smoke and CO detectors, replace batteries',
      category: 'electrical',
      recurrence_type: 'monthly',
      recurrence_interval: 6,
      recurrence_config: null,
    },
    {
      title: 'Replace smoke detector batteries',
      description: 'Replace batteries in all smoke and CO detectors',
      category: 'electrical',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },

    // General
    {
      title: 'Deep clean carpets',
      description: 'Professional or DIY carpet cleaning',
      category: 'general',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Clean windows',
      description: 'Wash interior and exterior windows',
      category: 'general',
      recurrence_type: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Check weatherstripping',
      description: 'Inspect and replace worn weatherstripping on doors and windows',
      category: 'general',
      recurrence_type: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Clean kitchen exhaust fan',
      description: 'Remove and clean range hood filters',
      category: 'general',
      recurrence_type: 'monthly',
      recurrence_interval: 3,
      recurrence_config: null,
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO task_templates (
      title, description, category,
      suggested_recurrence_type, suggested_recurrence_interval, suggested_recurrence_config,
      is_system_template
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  for (const template of templates) {
    stmt.run(
      template.title,
      template.description,
      template.category,
      template.recurrence_type,
      template.recurrence_interval,
      template.recurrence_config
    );
  }

  console.log(`Seeded ${templates.length} task templates`);
}
