-- Seed: 15 child-friendly places in Seattle
-- Run in Supabase SQL editor after applying schema.sql

insert into places (name, type, address, description, stages, accessibility, tags, lat, lng, rating, submitted_by, is_seed) values

('Green Lake Park', 'Park', '7201 E Green Lake Dr N, Seattle, WA 98115',
 'A beloved Seattle park with a 2.8-mile paved loop around the lake, two playgrounds, a wading pool, and wide paths ideal for prams and bikes.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair','blue_badge'],
 array['Pram Accessible','Free Entry','Fenced Area'], 47.6803, -122.3290, 4.8, 'Sarah M.', true),

('Seattle Children''s Museum', 'Museum', '305 Harrison St, Seattle, WA 98109',
 'Hands-on interactive exhibits designed for kids 0–10, including a toddler zone, global village, and sensory-friendly sessions on select mornings.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair','sensory_friendly','autism_friendly','changing_places'],
 array['Soft Play','Nursing Area','Changing Facilities','High Chairs'], 47.6205, -122.3517, 4.6, 'James T.', true),

('Ballard Commons Park', 'Park', '5701 22nd Ave NW, Seattle, WA 98107',
 'Splash pad, skate bowl, and a large playground make this a hit for all ages. The wading area is gated and the splash pad is free in summer.',
 array['toddler','preschool','bigkids','tweens'], array['wheelchair'],
 array['Free Entry','Fenced Area','Pram Accessible'], 47.6687, -122.3836, 4.5, 'Maria L.', true),

('Burke Museum of Natural History', 'Museum', '4300 15th Ave NE, Seattle, WA 98105',
 'UW campus museum with dinosaur fossils, Pacific Northwest wildlife, and hands-on discovery areas for young explorers.',
 array['preschool','bigkids','tweens'], array['wheelchair','blue_badge','quiet_space'],
 array['Free Entry','Pram Accessible'], 47.6601, -122.3094, 4.4, 'Anna K.', true),

('Volunteer Park', 'Park', '1247 15th Ave E, Seattle, WA 98112',
 'Capitol Hill gem with a wading pool, playground, conservatory, and water tower kids can climb. Spacious lawns great for picnics.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair','blue_badge'],
 array['Free Entry','Pram Accessible','Enclosed Outdoor Space'], 47.6374, -122.3151, 4.7, 'Tom R.', true),

('Westcrest Park', 'Park', '9000 8th Ave SW, Seattle, WA 98106',
 'Off-leash dog area aside, this park has a brilliant fenced playground and skate park. Great for big kids with plenty of shade.',
 array['toddler','preschool','bigkids','tweens'], array['wheelchair'],
 array['Free Entry','Fenced Area'], 47.5284, -122.3446, 4.3, 'Priya S.', true),

('Magnuson Park', 'Park', '7400 Sand Point Way NE, Seattle, WA 98115',
 'Huge park with a fenced off-leash beach, accessible playground, sports fields, and a sensory garden. Plenty of parking.',
 array['baby','toddler','preschool','bigkids','tweens'], array['wheelchair','blue_badge','sensory_friendly'],
 array['Free Entry','Pram Accessible','Fenced Area','Enclosed Outdoor Space'], 47.6788, -122.2560, 4.6, 'Chris D.', true),

('Seattle Public Library — Central Branch', 'Library', '1000 4th Ave, Seattle, WA 98104',
 'The iconic glass library runs toddler story time, STEM drop-ins, and has a dedicated children''s section on level 4 with picture books and comfy seating.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair','changing_places','sensory_friendly'],
 array['Free Entry','Pram Accessible','Nursing Area','Quiet Space'], 47.6065, -122.3321, 4.5, 'Lena W.', true),

('Fremont Sunday Market Café', 'Café', '3401 Evanston Ave N, Seattle, WA 98103',
 'Relaxed café next to the market with high chairs, a kids'' corner with books and toys, and a pram-friendly layout. Great flat whites.',
 array['baby','toddler','preschool'], array['wheelchair','changing_places'],
 array['High Chairs','Nursing Area','Changing Facilities','Pram Accessible'], 47.6497, -122.3508, 4.2, 'Rachel B.', true),

('Woodland Park Zoo', 'Attraction', '5500 Phinney Ave N, Seattle, WA 98103',
 'Award-winning zoo with naturalistic habitats. The Zoomazium indoor nature play space is perfect for under-5s on rainy days.',
 array['baby','toddler','preschool','bigkids','tweens'], array['wheelchair','blue_badge','changing_places','sensory_friendly'],
 array['Nursing Area','Changing Facilities','High Chairs','Pram Accessible','Café On Site'], 47.6685, -122.3503, 4.7, 'Oliver P.', true),

('Bitter Lake Community Center', 'Attraction', '13035 Linden Ave N, Seattle, WA 98133',
 'Community center with indoor soft play, toddler gym sessions, swim lessons, and low-cost drop-in activities throughout the week.',
 array['baby','toddler','preschool'], array['wheelchair','changing_places','sensory_friendly'],
 array['Soft Play','Changing Facilities','Nursing Area'], 47.7178, -122.3446, 4.1, 'Nina H.', true),

('Cal Anderson Park', 'Park', '1635 11th Ave, Seattle, WA 98122',
 'Capitol Hill park with a reflecting pool, playground, and open lawns. The wading pool is popular in summer. Very pram-friendly paths.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair'],
 array['Free Entry','Pram Accessible'], 47.6165, -122.3188, 4.3, 'Jake F.', true),

('Oxbow Farm & Conservation Center', 'Attraction', '10819 Carnation Duvall Rd NE, Carnation, WA 98014',
 'Just outside Seattle, this working organic farm offers u-pick flowers, farm animals, and gentle trails that little ones love.',
 array['toddler','preschool','bigkids'], array['wheelchair'],
 array['Free Entry','Enclosed Outdoor Space','Pram Accessible'], 47.6497, -121.9160, 4.5, 'Emma C.', true),

('Third Place Books Seward Park', 'Library', '5041 Wilson Ave S, Seattle, WA 98118',
 'Independent bookshop with a large children''s section, weekly story time for 0–5s, and a café next door. Welcoming, unhurried atmosphere.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair','changing_places'],
 array['Free Entry','Nursing Area','Café On Site','Pram Accessible'], 47.5503, -122.2679, 4.6, 'Keiko M.', true),

('Alki Beach Park', 'Park', '1702 Alki Ave SW, Seattle, WA 98116',
 'West Seattle''s sandy beach with a paved path stretching 2.5 miles. Calm water makes it great for paddling in summer. Stunning skyline views.',
 array['baby','toddler','preschool','bigkids','tweens'], array['wheelchair','blue_badge'],
 array['Free Entry','Pram Accessible'], 47.5760, -122.4132, 4.8, 'Dan S.', true),

('PlayDate SEA', 'Attraction', '1275 Mercer St, Seattle, WA 98109',
 'South Lake Union indoor playground that parents consistently recommend for rainy days. Multilevel play structure with slides, tubes, tunnels, a dance floor, and ball cannon. Separate toddler area for under-3s. Attached café serves pizza, smoothies, and decent coffee so you can actually sit down. Open daily 10am–7pm.',
 array['baby','toddler','preschool','bigkids'], array['wheelchair','changing_places'],
 array['Soft Play','High Chairs','Café On Site','Changing Facilities','Nursing Area','Pram Accessible'], 47.6239, -122.3368, 4.5, 'Priya S.', true),

('Seattle Aquarium', 'Attraction', '1483 Alaskan Way Pier 59, Seattle, WA 98101',
 'A firm favourite with young kids — the touch pools with sea stars and anemones are always a hit and staff are great at engaging toddlers. The underwater dome is magical for all ages. Lots of events and learning activities. Can get very busy on weekends; book tickets in advance. Members get free unlimited visits.',
 array['baby','toddler','preschool','bigkids','tweens'], array['wheelchair','blue_badge','changing_places'],
 array['Pram Accessible','Changing Facilities','Café On Site','High Chairs'], 47.6069, -122.3426, 4.7, 'Rachel B.', true),

('Ballard Locks (Hiram M. Chittenden Locks)', 'Attraction', '3015 NW 54th St, Seattle, WA 98107',
 'Genuinely one of the best free things to do in Seattle with kids. Watch boats move between Puget Sound and Lake Union through the locks, then walk over to the fish ladder viewing windows to see salmon swimming upstream (best July–September). Free guided tours on weekday afternoons. The botanical gardens alongside are great for a wander with a pram.',
 array['baby','toddler','preschool','bigkids','tweens'], array['wheelchair','blue_badge'],
 array['Free Entry','Pram Accessible','Enclosed Outdoor Space'], 47.6654, -122.3970, 4.8, 'Tom R.', true),

('Artists at Play — Seattle Center', 'Playground', '305 Harrison St, Seattle, WA 98109',
 'One of the best playgrounds in the city. 30-foot climbing tower, two large slides, rope nets, and a sensory garden with interactive musical elements. Located at Seattle Center so easy to combine with the Children''s Museum or Pacific Science Center. Completely free. The design genuinely works for kids from confident toddlers right up to tweens.',
 array['toddler','preschool','bigkids','tweens'], array['wheelchair','sensory_friendly'],
 array['Free Entry','Pram Accessible','Sensory Sessions'], 47.6214, -122.3517, 4.7, 'Maria L.', true),

('Frye Art Museum', 'Museum', '704 Terry Ave, Seattle, WA 98104',
 'Always free admission — no tickets, no booking, just show up. Small enough to do in an hour which is about right for young children. Has a thoughtful family programme with drop-in art activities most weekends. Staff are welcoming to families. The café is decent. A good option when you want culture without the pressure of making it worth an expensive ticket.',
 array['toddler','preschool','bigkids'], array['wheelchair','quiet_space','changing_places'],
 array['Free Entry','Pram Accessible','Café On Site','Changing Facilities'], 47.6074, -122.3240, 4.4, 'Lena W.', true);
