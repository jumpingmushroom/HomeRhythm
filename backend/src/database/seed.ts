import { getDatabase } from './index';

export function seedTemplates() {
  const db = getDatabase();

  const templates = [
    // Exterior
    {
      title: 'Clean gutters',
      description: 'Remove leaves and debris from gutters and downspouts',
      category: 'exterior',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Power wash exterior',
      description: 'Clean siding, deck, and driveway',
      category: 'exterior',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Inspect roof',
      description: 'Check for damaged or missing shingles',
      category: 'exterior',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Seal driveway',
      description: 'Apply sealant to asphalt driveway',
      category: 'exterior',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ season: 'summer' }),
    },
    {
      title: 'Winterize outdoor faucets',
      description: 'Drain and cover outdoor water spigots',
      category: 'plumbing',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },

    // HVAC
    {
      title: 'Replace HVAC filters',
      description: 'Change air filters for heating and cooling system',
      category: 'hvac',
      recurrence_pattern: 'monthly',
      recurrence_interval: 3,
      recurrence_config: null,
    },
    {
      title: 'Service HVAC system',
      description: 'Professional maintenance of heating and cooling system',
      category: 'hvac',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Clean furnace',
      description: 'Clean burners and check furnace operation',
      category: 'hvac',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Service heat pump',
      description: 'Professional heat pump inspection and servicing',
      category: 'hvac',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },

    // Appliances
    {
      title: 'Clean dryer vent',
      description: 'Remove lint buildup from dryer exhaust vent',
      category: 'appliances',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: null,
    },
    {
      title: 'Clean refrigerator coils',
      description: 'Vacuum condenser coils on refrigerator',
      category: 'appliances',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: null,
    },
    {
      title: 'Replace water filter',
      description: 'Change refrigerator or whole-house water filter',
      category: 'appliances',
      recurrence_pattern: 'monthly',
      recurrence_interval: 6,
      recurrence_config: null,
    },
    {
      title: 'Clean dishwasher filter',
      description: 'Remove and clean dishwasher filter and spray arms',
      category: 'appliances',
      recurrence_pattern: 'monthly',
      recurrence_interval: 3,
      recurrence_config: null,
    },

    // Landscaping
    {
      title: 'Fertilize lawn',
      description: 'Apply seasonal fertilizer to lawn',
      category: 'landscaping',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Aerate lawn',
      description: 'Core aeration of lawn for better water and nutrient absorption',
      category: 'landscaping',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Prune trees and shrubs',
      description: 'Trim back overgrown branches',
      category: 'landscaping',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Mulch garden beds',
      description: 'Apply fresh mulch to garden beds',
      category: 'landscaping',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Winterize sprinkler system',
      description: 'Blow out irrigation lines and shut off water',
      category: 'landscaping',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },

    // Plumbing
    {
      title: 'Test sump pump',
      description: 'Pour water into sump pit to test pump operation',
      category: 'plumbing',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Flush water heater',
      description: 'Drain sediment from water heater tank',
      category: 'plumbing',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: null,
    },
    {
      title: 'Check for leaks',
      description: 'Inspect under sinks, around toilets, and exposed pipes',
      category: 'plumbing',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: null,
    },

    // Electrical
    {
      title: 'Test GFCI outlets',
      description: 'Press test button on all GFCI outlets',
      category: 'electrical',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: null,
    },
    {
      title: 'Test smoke detectors',
      description: 'Test all smoke and CO detectors, replace batteries',
      category: 'electrical',
      recurrence_pattern: 'monthly',
      recurrence_interval: 6,
      recurrence_config: null,
    },
    {
      title: 'Replace smoke detector batteries',
      description: 'Replace batteries in all smoke and CO detectors',
      category: 'electrical',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },

    // General
    {
      title: 'Deep clean carpets',
      description: 'Professional or DIY carpet cleaning',
      category: 'general',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'spring' }),
    },
    {
      title: 'Clean windows',
      description: 'Wash interior and exterior windows',
      category: 'general',
      recurrence_pattern: 'yearly',
      recurrence_interval: 2,
      recurrence_config: JSON.stringify({ seasons: ['spring', 'fall'] }),
    },
    {
      title: 'Check weatherstripping',
      description: 'Inspect and replace worn weatherstripping on doors and windows',
      category: 'general',
      recurrence_pattern: 'yearly',
      recurrence_interval: 1,
      recurrence_config: JSON.stringify({ season: 'fall' }),
    },
    {
      title: 'Clean kitchen exhaust fan',
      description: 'Remove and clean range hood filters',
      category: 'general',
      recurrence_pattern: 'monthly',
      recurrence_interval: 3,
      recurrence_config: null,
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO task_templates (
      title, description, category,
      suggested_recurrence_pattern, suggested_recurrence_interval, suggested_recurrence_config,
      is_system_template
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  for (const template of templates) {
    stmt.run(
      template.title,
      template.description,
      template.category,
      template.recurrence_pattern,
      template.recurrence_interval,
      template.recurrence_config
    );
  }

  console.log(`Seeded ${templates.length} task templates`);

  // Seed template subtasks
  const templateSubtasks: Record<string, string[]> = {
    'Clean gutters': [
      'Set up ladder safely on level ground',
      'Remove large debris by hand',
      'Flush gutters with garden hose',
      'Check and clear downspouts',
      'Clean up debris from ground',
      'Inspect for damage or loose sections',
    ],
    'Power wash exterior': [
      'Clear area of furniture and decorations',
      'Cover electrical outlets and fixtures',
      'Pre-treat stains with cleaning solution',
      'Power wash siding from top to bottom',
      'Clean deck and driveway',
      'Allow surfaces to dry completely',
    ],
    'Inspect roof': [
      'Use binoculars to inspect from ground (safer option)',
      'Look for missing or damaged shingles',
      'Check for moss or algae growth',
      'Inspect flashing around chimneys and vents',
      'Check for debris accumulation',
      'Document any issues with photos',
    ],
    'Seal driveway': [
      'Clean driveway thoroughly',
      'Repair any cracks with crack filler',
      'Allow repairs to cure (24-48 hours)',
      'Apply sealant in even coats',
      'Allow proper drying time',
      'Mark off area until fully cured',
    ],
    'Winterize outdoor faucets': [
      'Shut off interior water valves to outdoor faucets',
      'Drain water from outdoor faucets',
      'Remove and store garden hoses',
      'Install insulated faucet covers',
      'Check for leaks or drips',
    ],
    'Replace HVAC filters': [
      'Turn off HVAC system',
      'Locate and open filter compartment',
      'Remove old filter and note size',
      'Insert new filter (check airflow direction arrow)',
      'Close compartment securely',
      'Turn system back on and verify operation',
    ],
    'Service HVAC system': [
      'Schedule appointment with HVAC technician',
      'Provide clear access to equipment',
      'Review findings with technician',
      'Keep service records in maintenance log',
      'Schedule next service appointment',
    ],
    'Clean furnace': [
      'Turn off power and gas to furnace',
      'Remove furnace cover',
      'Vacuum burners and blower compartment',
      'Check and clean flame sensor',
      'Inspect heat exchanger for cracks',
      'Replace cover and restore power',
    ],
    'Service heat pump': [
      'Schedule appointment with HVAC technician',
      'Clear area around outdoor unit',
      'Review maintenance checklist with technician',
      'Ask about refrigerant levels',
      'Keep service records',
    ],
    'Clean dryer vent': [
      'Unplug dryer and pull away from wall',
      'Disconnect vent hose from back of dryer',
      'Use vent brush to clean vent duct',
      'Clean lint from vent hose',
      'Clean lint trap and housing',
      'Reconnect vent hose securely',
      'Push dryer back and test operation',
    ],
    'Clean refrigerator coils': [
      'Unplug refrigerator',
      'Locate condenser coils (usually on back or bottom)',
      'Vacuum coils using brush attachment',
      'Wipe down surrounding area',
      'Plug refrigerator back in',
      'Check that cooling resumes normally',
    ],
    'Replace water filter': [
      'Locate water filter (check manual if needed)',
      'Turn off water supply if required',
      'Remove old filter',
      'Install new filter according to instructions',
      'Run water for 3-5 minutes to flush',
      'Reset filter indicator light if present',
    ],
    'Clean dishwasher filter': [
      'Remove bottom dish rack',
      'Locate and remove filter assembly',
      'Rinse filter under running water',
      'Scrub with soft brush if needed',
      'Check and clean spray arm holes',
      'Reinstall filter and rack',
    ],
    'Fertilize lawn': [
      'Mow lawn before fertilizing',
      'Choose appropriate fertilizer for season',
      'Calibrate spreader according to instructions',
      'Apply fertilizer in overlapping rows',
      'Water lawn lightly after application',
      'Keep pets and children off lawn as directed',
    ],
    'Aerate lawn': [
      'Mark sprinkler heads and utilities',
      'Mow lawn shorter than usual',
      'Water lawn day before (soil should be moist)',
      'Use core aerator across entire lawn',
      'Leave soil plugs on lawn to break down',
      'Overseed if desired',
    ],
    'Prune trees and shrubs': [
      'Inspect plants for dead or diseased branches',
      'Sterilize pruning tools with rubbing alcohol',
      'Remove dead, damaged, or crossing branches',
      'Make clean cuts at proper angle',
      'Clear and dispose of cuttings',
      'Apply wound dressing to large cuts if needed',
    ],
    'Mulch garden beds': [
      'Pull weeds from garden beds',
      'Edge beds for clean appearance',
      'Calculate mulch needed (2-3 inches deep)',
      'Spread mulch evenly around plants',
      'Keep mulch away from plant stems',
      'Water beds lightly to settle mulch',
    ],
    'Winterize sprinkler system': [
      'Turn off water supply to sprinkler system',
      'Drain water from backflow preventer',
      'Set up air compressor (or hire professional)',
      'Blow out each zone systematically',
      'Insulate above-ground components',
      'Store removable components indoors',
    ],
    'Test sump pump': [
      'Locate sump pump in basement',
      'Pour 5 gallons of water into sump pit',
      'Verify pump activates automatically',
      'Check that water is pumped out properly',
      'Listen for unusual noises',
      'Test backup pump if present',
    ],
    'Flush water heater': [
      'Turn off power/gas to water heater',
      'Turn off cold water supply valve',
      'Connect garden hose to drain valve',
      'Run hose to floor drain or outside',
      'Open drain valve and pressure relief valve',
      'Drain until water runs clear',
      'Close valves, remove hose, refill tank',
      'Restore power/gas and check operation',
    ],
    'Check for leaks': [
      'Inspect under all sinks for moisture',
      'Check around toilet bases',
      'Examine exposed pipes in basement',
      'Look for water stains on ceilings',
      'Check water meter for hidden leaks',
      'Document any issues with photos',
    ],
    'Test GFCI outlets': [
      'Locate all GFCI outlets (bathrooms, kitchen, garage)',
      'Press TEST button on each outlet',
      'Verify power cuts off (test with nightlight)',
      'Press RESET button to restore power',
      'Check that reset is successful',
      'Replace any non-functioning GFCIs',
    ],
    'Test smoke detectors': [
      'Press and hold test button on each detector',
      'Verify alarm sounds loudly',
      'Test from multiple rooms to check volume',
      'Clean detector covers with vacuum',
      'Check battery level indicators',
      'Record test date on each detector',
    ],
    'Replace smoke detector batteries': [
      'Purchase correct battery type',
      'Remove detector from mounting bracket',
      'Replace old batteries with new ones',
      'Test detector before remounting',
      'Vacuum detector cover while open',
      'Record battery replacement date',
    ],
    'Deep clean carpets': [
      'Remove furniture and clear floor',
      'Vacuum thoroughly to remove loose dirt',
      'Pre-treat stains and high-traffic areas',
      'Rent or prepare carpet cleaning machine',
      'Clean carpets in overlapping sections',
      'Open windows and run fans to dry',
      'Vacuum again after carpets are fully dry',
    ],
    'Clean windows': [
      'Gather supplies (squeegee, cleaner, rags)',
      'Remove screens and clean separately',
      'Wash exterior windows first',
      'Clean interior windows',
      'Wipe window sills and tracks',
      'Reinstall screens',
    ],
    'Check weatherstripping': [
      'Inspect all exterior doors for gaps',
      'Check window weatherstripping',
      'Test with dollar bill (should have resistance)',
      'Remove and replace worn weatherstripping',
      'Check door sweeps at bottom',
      'Test doors for proper seal',
    ],
    'Clean kitchen exhaust fan': [
      'Turn off power to range hood',
      'Remove filter (check manual for type)',
      'Soak filter in hot soapy water or dishwasher',
      'Wipe down hood interior and exterior',
      'Scrub filter if needed',
      'Dry and reinstall filter',
      'Test fan operation',
    ],
  };

  // Seed subtasks for each template
  const subtaskStmt = db.prepare(`
    INSERT INTO template_subtasks (template_id, text, position)
    SELECT id, ?, ? FROM task_templates WHERE title = ?
  `);

  let totalSubtasks = 0;
  for (const [templateTitle, subtasksArray] of Object.entries(templateSubtasks)) {
    subtasksArray.forEach((subtaskText, index) => {
      subtaskStmt.run(subtaskText, index, templateTitle);
      totalSubtasks++;
    });
  }

  console.log(`Seeded ${totalSubtasks} template subtasks across ${Object.keys(templateSubtasks).length} templates`);
}

export function seedTemplateSubtasks() {
  const db = getDatabase();

  const templateSubtasks: Record<string, string[]> = {
    'Clean gutters': [
      'Set up ladder safely on level ground',
      'Remove large debris by hand',
      'Flush gutters with garden hose',
      'Check and clear downspouts',
      'Clean up debris from ground',
      'Inspect for damage or loose sections',
    ],
    'Power wash exterior': [
      'Clear area of furniture and decorations',
      'Cover electrical outlets and fixtures',
      'Pre-treat stains with cleaning solution',
      'Power wash siding from top to bottom',
      'Clean deck and driveway',
      'Allow surfaces to dry completely',
    ],
    'Inspect roof': [
      'Use binoculars to inspect from ground (safer option)',
      'Look for missing or damaged shingles',
      'Check for moss or algae growth',
      'Inspect flashing around chimneys and vents',
      'Check for debris accumulation',
      'Document any issues with photos',
    ],
    'Seal driveway': [
      'Clean driveway thoroughly',
      'Repair any cracks with crack filler',
      'Allow repairs to cure (24-48 hours)',
      'Apply sealant in even coats',
      'Allow proper drying time',
      'Mark off area until fully cured',
    ],
    'Winterize outdoor faucets': [
      'Shut off interior water valves to outdoor faucets',
      'Drain water from outdoor faucets',
      'Remove and store garden hoses',
      'Install insulated faucet covers',
      'Check for leaks or drips',
    ],
    'Replace HVAC filters': [
      'Turn off HVAC system',
      'Locate and open filter compartment',
      'Remove old filter and note size',
      'Insert new filter (check airflow direction arrow)',
      'Close compartment securely',
      'Turn system back on and verify operation',
    ],
    'Service HVAC system': [
      'Schedule appointment with HVAC technician',
      'Provide clear access to equipment',
      'Review findings with technician',
      'Keep service records in maintenance log',
      'Schedule next service appointment',
    ],
    'Clean furnace': [
      'Turn off power and gas to furnace',
      'Remove furnace cover',
      'Vacuum burners and blower compartment',
      'Check and clean flame sensor',
      'Inspect heat exchanger for cracks',
      'Replace cover and restore power',
    ],
    'Service heat pump': [
      'Schedule appointment with HVAC technician',
      'Clear area around outdoor unit',
      'Review maintenance checklist with technician',
      'Ask about refrigerant levels',
      'Keep service records',
    ],
    'Clean dryer vent': [
      'Unplug dryer and pull away from wall',
      'Disconnect vent hose from back of dryer',
      'Use vent brush to clean vent duct',
      'Clean lint from vent hose',
      'Clean lint trap and housing',
      'Reconnect vent hose securely',
      'Push dryer back and test operation',
    ],
    'Clean refrigerator coils': [
      'Unplug refrigerator',
      'Locate condenser coils (usually on back or bottom)',
      'Vacuum coils using brush attachment',
      'Wipe down surrounding area',
      'Plug refrigerator back in',
      'Check that cooling resumes normally',
    ],
    'Replace water filter': [
      'Locate water filter (check manual if needed)',
      'Turn off water supply if required',
      'Remove old filter',
      'Install new filter according to instructions',
      'Run water for 3-5 minutes to flush',
      'Reset filter indicator light if present',
    ],
    'Clean dishwasher filter': [
      'Remove bottom dish rack',
      'Locate and remove filter assembly',
      'Rinse filter under running water',
      'Scrub with soft brush if needed',
      'Check and clean spray arm holes',
      'Reinstall filter and rack',
    ],
    'Fertilize lawn': [
      'Mow lawn before fertilizing',
      'Choose appropriate fertilizer for season',
      'Calibrate spreader according to instructions',
      'Apply fertilizer in overlapping rows',
      'Water lawn lightly after application',
      'Keep pets and children off lawn as directed',
    ],
    'Aerate lawn': [
      'Mark sprinkler heads and utilities',
      'Mow lawn shorter than usual',
      'Water lawn day before (soil should be moist)',
      'Use core aerator across entire lawn',
      'Leave soil plugs on lawn to break down',
      'Overseed if desired',
    ],
    'Prune trees and shrubs': [
      'Inspect plants for dead or diseased branches',
      'Sterilize pruning tools with rubbing alcohol',
      'Remove dead, damaged, or crossing branches',
      'Make clean cuts at proper angle',
      'Clear and dispose of cuttings',
      'Apply wound dressing to large cuts if needed',
    ],
    'Mulch garden beds': [
      'Pull weeds from garden beds',
      'Edge beds for clean appearance',
      'Calculate mulch needed (2-3 inches deep)',
      'Spread mulch evenly around plants',
      'Keep mulch away from plant stems',
      'Water beds lightly to settle mulch',
    ],
    'Winterize sprinkler system': [
      'Turn off water supply to sprinkler system',
      'Drain water from backflow preventer',
      'Set up air compressor (or hire professional)',
      'Blow out each zone systematically',
      'Insulate above-ground components',
      'Store removable components indoors',
    ],
    'Test sump pump': [
      'Locate sump pump in basement',
      'Pour 5 gallons of water into sump pit',
      'Verify pump activates automatically',
      'Check that water is pumped out properly',
      'Listen for unusual noises',
      'Test backup pump if present',
    ],
    'Flush water heater': [
      'Turn off power/gas to water heater',
      'Turn off cold water supply valve',
      'Connect garden hose to drain valve',
      'Run hose to floor drain or outside',
      'Open drain valve and pressure relief valve',
      'Drain until water runs clear',
      'Close valves, remove hose, refill tank',
      'Restore power/gas and check operation',
    ],
    'Check for leaks': [
      'Inspect under all sinks for moisture',
      'Check around toilet bases',
      'Examine exposed pipes in basement',
      'Look for water stains on ceilings',
      'Check water meter for hidden leaks',
      'Document any issues with photos',
    ],
    'Test GFCI outlets': [
      'Locate all GFCI outlets (bathrooms, kitchen, garage)',
      'Press TEST button on each outlet',
      'Verify power cuts off (test with nightlight)',
      'Press RESET button to restore power',
      'Check that reset is successful',
      'Replace any non-functioning GFCIs',
    ],
    'Test smoke detectors': [
      'Press and hold test button on each detector',
      'Verify alarm sounds loudly',
      'Test from multiple rooms to check volume',
      'Clean detector covers with vacuum',
      'Check battery level indicators',
      'Record test date on each detector',
    ],
    'Replace smoke detector batteries': [
      'Purchase correct battery type',
      'Remove detector from mounting bracket',
      'Replace old batteries with new ones',
      'Test detector before remounting',
      'Vacuum detector cover while open',
      'Record battery replacement date',
    ],
    'Deep clean carpets': [
      'Remove furniture and clear floor',
      'Vacuum thoroughly to remove loose dirt',
      'Pre-treat stains and high-traffic areas',
      'Rent or prepare carpet cleaning machine',
      'Clean carpets in overlapping sections',
      'Open windows and run fans to dry',
      'Vacuum again after carpets are fully dry',
    ],
    'Clean windows': [
      'Gather supplies (squeegee, cleaner, rags)',
      'Remove screens and clean separately',
      'Wash exterior windows first',
      'Clean interior windows',
      'Wipe window sills and tracks',
      'Reinstall screens',
    ],
    'Check weatherstripping': [
      'Inspect all exterior doors for gaps',
      'Check window weatherstripping',
      'Test with dollar bill (should have resistance)',
      'Remove and replace worn weatherstripping',
      'Check door sweeps at bottom',
      'Test doors for proper seal',
    ],
    'Clean kitchen exhaust fan': [
      'Turn off power to range hood',
      'Remove filter (check manual for type)',
      'Soak filter in hot soapy water or dishwasher',
      'Wipe down hood interior and exterior',
      'Scrub filter if needed',
      'Dry and reinstall filter',
      'Test fan operation',
    ],
  };

  // Seed subtasks for each template
  const subtaskStmt = db.prepare(`
    INSERT INTO template_subtasks (template_id, text, position)
    SELECT id, ?, ? FROM task_templates WHERE title = ?
  `);

  let totalSubtasks = 0;
  for (const [templateTitle, subtasksArray] of Object.entries(templateSubtasks)) {
    subtasksArray.forEach((subtaskText, index) => {
      subtaskStmt.run(subtaskText, index, templateTitle);
      totalSubtasks++;
    });
  }

  console.log(`Seeded ${totalSubtasks} template subtasks across ${Object.keys(templateSubtasks).length} templates`);
}
