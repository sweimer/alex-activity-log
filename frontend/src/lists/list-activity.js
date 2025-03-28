// list-activity.js
const activityListItems = [
    {
        category: "WAKE",
        items: [
            "Alex woke at 600am, went to the bathroom, and went back to bed.",
            "Alex woke back up at 730am.",
            "Alex woke on her own around 730am and took herself to the bathroom.",
            "Alex slept in until 830am.",
            "Sponsor/Relief woke Alex at 730am."
        ]
    },
    {
        category: "MORNING",
        items: [
            "Sponsor/Relief helped Alex get dressed and brush her teeth and hair.",
            "Sponsor/Relief helped Alex brush teeth and hair.",
            "",
            "Alex picked the pink dress with black tights from the outfits hanging outside her dresser.",
            "Sponsor/Relief helped Alex pick out an outfit from the ones hanging outside her dresser.",
            "Alex put her shoes on the wrong feet and Sponsor/Relief helped Alex put them on right.",
            "Alex put her dress on backwards and Sponsor/Relief helped Alex put it on right.",
            "",
            "Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores."
        ]
    },
    {
        category: "BREAKFAST",
        items: [
            "Sponsor/Relief asked Alex if she wanted cereal or oats for breakfast. Alex picked Oats.",
            "",
            "Alex said she wanted cereal for breakfast.",
            "Sponsor/Relief prepared cereal, monitored Alex as she ate and administered AM meds.",
            "",
            "Sponsor/Relief already prepared breakfast.",
            "Sponsor/Relief monitored Alex as she ate and administered AM meds.",
            "Alex ate Breakfast and was monitored by Sponsor/Relief.",
            "Sponsor/Relief administered AM meds.",
            "",
            "While eating. Sponsor, Relief and Alex discussed the menu for the upcoming week and made a small shopping list.",
            "",
            "Alex helped clear the table.",
            "Sponsor/Relief made Alex tea and made sure it was the right temperature.",
            "Alex drank her tea until the van arrived.",
            "Alex watched TV until the van arrived.",
            "",
            "Van arrived at 830am to take Alex to Diversity.",
            "Van returned at 230pm.",
            "",
            "Kiearra arrived at 800am to take Alex out for a girl's day."
            "Kiearra and Alex had a manicure, went to a move and had lunch at the theater",
            "Kiearra returned at 330pm.",
        ]
    },
    {
        category: "MIDDAY",
        items: [
            "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
            "Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles.",
            "Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.",
            "Sponsor/Relief and Alex took Izzy to the senior center to chase balls. Alex walked several laps around the field.",
            "Sponsor/Relief and Alex took Izzy back home.",
            "",
            "Relief and Alex worked on making a bead bracelets while watching TV.",
            "Sponsor/Relief asked Alex if she wanted to work on a beading craft. Alex said yes. Sponsor set Alex up with beads in the family room and checked in on her as she worked on it.",
            "",
            "Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores.",
            "Alex helped Sponsor put away some laundry.",
            "Sponsor and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser.",
            "",
            "Sponsor asked Alex if she wanted to go to Target. Alex said yes. Alex helped push the buggy and carry the bags to the car and into the house.",
            "Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home.",
            "Relief and Alex waited in the car while Sponsor shopped.",
            "Alex helped push the car, load the car and unload the car back home.",
            "Sponsor/Relief and Alex took Izzy back home.",
            "",
            "Sponsor, Relief and Alex watched a movie on TV.",
            "",
            "Sponsor/Relief ran a fire drill, helped Alex respond to the alarm and helped Alex evacuate to the meeting place in the front yard."
        ]
    },
    {
        category: "LUNCH",
        items: [
            "Sponsor/Relief prepared lunch and monitored Alex as she ate.",
            "Alex watched a little tv while Sponsor/Relief prepared lunch.",
            "Alex helped Sponsor cook home-made granola.",
            "Alex helped clear the table."
        ]
    },
    {
        category: "AFTER LUNCH",
        items: [
            "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
            "Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles.",
            "Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.",
            "Sponsor/Relief and Alex took Izzy to the senior center to chase balls. Alex walked several laps around the field.",
            "Sponsor/Relief and Alex took Izzy back home.",
            "",
            "Relief and Alex worked on making a bead bracelets while watching TV.",
            "Sponsor/Relief asked Alex if she wanted to work on a beading craft. Alex said yes. Sponsor set Alex up with beads in the family room and checked in on her as she worked on it.",
            "",
            "Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores.",
            "Alex helped Sponsor put away some laundry.",
            "Sponsor and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser.",
            "",
            "Sponsor asked Alex if she wanted to go to Target. Alex said yes. Alex helped push the buggy and carry the bags to the car and into the house.",
            "Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home.",
            "Relief and Alex waited in the car while Sponsor shopped.",
            "Alex helped push the car, load the car and unload the car back home.",
            "Sponsor/Relief and Alex took Izzy back home.",
            "",
            "Sponsor, Relief and Alex watched a movie on TV.",
            "",
            "Sponsor/Relief ran a fire drill, helped Alex respond to the alarm and helped Alex evacuate to the meeting place in the front yard."
        ]
    },
    {
        category: "DINNER",
        items: [
            "Sponsor/Relief prepared dinner, monitored Alex as she ate and administered PM meds.",
            "Sponsor/Relief prepared dinner while Alex watched TV, monitored Alex as she ate and administered PM Meds.",
            "Sponsor/Relief prepared dinner and monitored Alex as she ate.",
            "Sponsor/Relief administered PM meds.",
            "Alex helped clear the table."
        ]
    },
    {
        category: "EVENING",
        items: [
            "Sponsor/Relief and Alex took Izzy for a quick neighborhood walk.",
            "Sponsor/Relief and Alex took Izzy to Huguenot Park. Alex walked 1.85 miles.",
            "Sponsor/Relief and Alex took Izzy to the water tower to walk a couple laps around the track.",
            "Sponsor/Relief and Alex took Izzy to the senior center to chase balls. Alex walked several laps around the field.",
            "Sponsor/Relief and Alex took Izzy back home.",
            "",
            "Relief and Alex worked on making a bead bracelets while watching TV.",
            "Sponsor/Relief asked Alex if she wanted to work on a beading craft. Alex said yes. Sponsor set Alex up with beads in the family room and checked in on her as she worked on it.",
            "",
            "Alex cleaned her room and organized her shelves. Sponsor/Relief checked on Alex until she completed her chores.",
            "Alex helped Sponsor put away some laundry.",
            "Sponsor and Alex picked out outfits for the upcoming week at Diversity and hung them outside her dresser.",
            "",
            "Sponsor asked Alex if she wanted to go to Target. Alex said yes. Alex helped push the buggy and carry the bags to the car and into the house.",
            "Sponsor/Relief and Alex went to Wegmans and picked up the groceries on the list. Alex helped push the cart, load the car and unload the car at home.",
            "Relief and Alex waited in the car while Sponsor shopped.",
            "Alex helped push the car, load the car and unload the car back home.",
            "Sponsor/Relief and Alex took Izzy back home.",
            "",
            "Sponsor, Relief and Alex watched a movie on TV.",
            "",
            "Sponsor/Relief ran a fire drill, helped Alex respond to the alarm and helped Alex evacuate to the meeting place in the front yard."
        ]
    },
    {
        category: "BED",
        items: [
            "Sponsor/Relief helped Alex shower and with ADLs and helped Alex put on PJs.",
            "Alex watched TV with family until she was tired and went to bed around 730pm.",
            "Sponsor/Relief helped Alex brush teeth and hair and put on PJs.",
            "Alex watched TV with family until she was tired and went to bed around 730pm.",
            "Alex went to bed around 730pm"
        ]
    },
];

export default activityListItems;