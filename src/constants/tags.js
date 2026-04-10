// dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const TAG_CONFIG = [
  { id: 'CHORE',                label: 'CHORE',                    expectedDays: [1],          hasCustomInput: false },
  { id: 'CAD',                  label: 'CAD',                      expectedDays: [2, 4, 6],    hasCustomInput: false },
  { id: 'MEAL_PLAN',            label: 'MEAL PLAN and GROCERY SHOP', expectedDays: [0],         hasCustomInput: false },
  { id: 'SHOWER',               label: 'SHOWER',                   expectedDays: [0, 2, 4, 6], hasCustomInput: false },
  { id: 'CHOICE',               label: 'CHOICE',                   expectedDays: [0,1,2,3,4,5,6], hasCustomInput: true },
  { id: 'NEW_SKILL',            label: 'NEW SKILL',                expectedDays: [],           hasCustomInput: true },
  { id: 'FIRE_DRILL',           label: 'FIRE DRILL',               expectedDays: [],           hasCustomInput: false },
  { id: 'BEHAVIOR_ISSUE',       label: 'BEHAVIOR ISSUE',           expectedDays: [],           hasCustomInput: true },
  { id: 'OUTING',               label: 'OUTING',                   expectedDays: [],           hasCustomInput: true },
  { id: 'INTERACTION',          label: 'INTERACTION',              expectedDays: [],           hasCustomInput: true },
]