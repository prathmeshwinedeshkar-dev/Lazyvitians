/* data-extra.js: merges the uploaded "VIT Pune - Extended Clubs & Student Activities Directory" PDF.
   Loaded after data.js and before data-verified.js, so verified evidence (data-verified.js) always wins over this.
   Trust level: "Directory listing" = taken from the compiled PDF. It has no per-club source links or check dates,
   so these entries are NOT counted as verified evidence. Edit this file to add or fix clubs; never guess a blank. */
(function () {
  "use strict";
  const D = window.CampusData; if (!D) return;
  // [id, name, categories, short description, domains, origin, achievement, instagram handle]
  // GDG on Campus is intentionally absent: its entry in data-verified.js has stronger evidence.
  const R = [
    ["mlsc", "Microsoft Learn Student Club (MLSC)", ["Technical", "Coding", "AI/ML"], "Microsoft-linked tech community with hands-on workshops, hackathons and industry sessions.", ["AI", "Web Development", "Cloud", "Hackathons", "Open Source", "Industry Sessions"], null, null, "mlscvitpune"],
    ["gedit", "GedIT Coding Club", ["Technical", "Coding"], "Coding club for programming practice, problem-solving and interview preparation.", ["Programming", "DSA", "Competitive Programming", "Software Development"], null, null, null],
    ["csi-vit", "CSI VIT, Pune", ["Technical", "Coding"], "Computer Society of India student chapter: coding events, research activities and tech discussions.", ["Coding", "Hackathons", "Research", "Emerging Tech", "Career Development"], null, null, "csi_vitpune"],
    ["ieee-sb", "IEEE Student Branch VIT, Pune", ["Technical"], "Gives students access to the global IEEE network through technical sessions, competitions and research exposure.", ["Technology", "Research", "Professional Networking", "Technical Events"], null, null, "ieee_vit_studentbranch"],
    ["ieee-ims", "IEEE IMS", ["Technical", "IoT"], "IEEE society group for instrumentation, sensors and measurement technologies.", ["Instrumentation", "Sensors", "Measurement", "Seminars", "R&D"], null, null, null],
    ["isa-vit", "ISA VIT, Pune", ["Technical"], "Student section of the International Society of Automation: industrial automation and instrumentation.", ["Automation", "Instrumentation", "Workshops", "Competitions", "Industry Lectures"], null, null, null],
    ["robotics-forum", "TRF – The Robotics Forum", ["Technical", "Robotics"], "VIT Pune's official robotics club: robots, embedded systems, automation and national competitions.", ["Robotics", "Embedded C", "Microcontrollers", "Computer Vision", "App Development", "Physical Modelling"], "2006", "All India Rank 3 at National DD Robocon 2025; described as the most awarded team of the competition", "vitpunerobotics"],
    ["iot-club", "IoT Club", ["Technical", "IoT"], "Practical connected-device projects covering hardware, sensors, microcontrollers and cloud.", ["IoT", "Embedded Systems", "Arduino", "ESP32", "Raspberry Pi", "Cloud Integration"], null, null, null],
    ["game-dev", "Game Dev+", ["Technical", "Design", "Coding"], "Community for making games and interactive experiences.", ["2D/3D Game Development", "Game Design", "Gamification"], null, null, null],
    ["reality-spectra", "SIG-Reality Spectra", ["Technical", "AI/ML"], "Special-interest group exploring AR, VR and AI-driven immersive technologies.", ["AR", "VR", "AI", "ML", "Deep Learning", "Interactive Projects"], null, null, null],
    ["team-quark", "Team Quark", ["Technical", "Coding"], "Experimental projects with newer technologies and hackathons.", ["Rust", "ROS", "Hackathons", "Emerging Tech", "Collaborative Projects"], null, null, null],
    ["innovsphere", "InnovSphere", ["Technical", "Entrepreneurship"], "Helps students move from ideas to working projects through research, open source and innovation events.", ["Research", "Open Source", "Patents", "Hackathons", "Technical Workshops"], null, null, null],
    ["ideators", "The Ideators Club (TIC)", ["Entrepreneurship", "Technical"], "Innovation-focused club turning ideas into prototypes, with skill-building and career readiness.", ["Ideation", "Prototyping", "Project Execution", "Career Readiness"], "2025–26 registration cycle", null, null],
    ["ekasutram", "Ekasutram – Mathematics Club", ["Technical"], "Makes mathematics engaging through puzzles, quizzes and problem-solving.", ["Mathematics", "Puzzles", "Quizzes", "Vedic Mathematics", "Problem-Solving"], null, null, null],
    ["antariksh", "Antariksh Club of VI", ["Astronomy"], "Astronomy and space-science club: telescopes, sky observation and science communication.", ["Astronomy", "Telescopes", "Star Parties", "Space Science", "Workshops"], null, null, null],
    ["indus-connect", "Indus Connect", ["Technical", "Entrepreneurship"], "Links students with industry through workshops, expert sessions and practical projects.", ["Industrial Projects", "Industry Exposure", "Workshops", "AI and Tech Sessions"], null, null, "icon_vitpune"],
    ["catalyst", "Club Catalyst", ["Mentoring"], "Mentoring and guidance initiative for educational support, career strategy and skill development.", ["Mentorship", "Educational Guidance", "Career Strategy", "Skill Enhancement"], null, null, null],
    ["vishwa-netrutvam", "Vishwa Netrutvam", ["Technical"], "Official Mechanical Engineering Department club: industrial visits, workshops and leadership activities.", ["Mechanical Engineering", "Industrial Visits", "Workshops", "Webinars", "Leadership"], "2020", null, null],
    ["chesa", "ChESA", ["Technical"], "Chemical Engineering Students' Association: academic, technical and industry activities.", ["Chemical Engineering", "Workshops", "Seminars", "Research", "Industry Interaction"], null, null, null],
    ["itsa", "ITSA", ["Technical", "Coding"], "Official IT department student association: modern tech skills, departmental events and mentorship.", ["IT", "AI Tools", "Web Development", "Data Science", "Cybersecurity", "Mentorship"], null, null, null],
    ["sesa", "SESA", ["Technical", "Coding"], "Software Engineering Students' Association: coding, career and collaborative technical activities.", ["Software Engineering", "Coding Challenges", "Hackathons", "DevOps", "Cloud Computing"], null, null, null],
    ["gfg", "GeeksforGeeks VIT Pune", ["Technical", "Coding"], "Coding and placement-preparation community focused on DSA and interview readiness.", ["Coding", "DSA", "Interview Preparation", "Technical Learning"], null, null, null],
    ["endurance", "Team Endurance Racing", ["Technical"], "Official SAE BAJA team: designs, builds and tests an all-terrain vehicle for national competitions.", ["ATV Design", "Manufacturing", "Vehicle Dynamics", "Powertrain", "CAE", "BAJA"], "2009", null, null],
    ["veloce", "Team Veloce Racing / Veloce Racing Electric", ["Technical"], "Formula Student team that designs and builds electric race cars for national events.", ["Formula Student", "Electric Vehicles", "Aerodynamics", "Chassis", "Powertrain", "BMS", "Vehicle Dynamics"], "2011", "Overall Champions and AIR 1 in the Electric Category at SUPRA SAE 2025; back-to-back AIR 1 in the EV segment; EV category winner at Formula Bharat 2026", "veloce_racing_india"],
    ["griffin", "Team Griffin India", ["Technical", "Robotics"], "Aeromodelling, drones and unmanned aerial vehicles: design, aerodynamics, structures and flight systems.", ["Aeromodelling", "UAVs", "Drones", "Avionics", "Aerodynamics", "Propulsion"], null, null, null],
    ["viculp", "ViCulP", ["Cultural"], "Official drama club: actors, writers and directors producing theatre and cultural productions.", ["Acting", "Direction", "Scriptwriting", "Stage Management", "Production Design"], null, null, "vit_viculp"],
    ["eklavya", "Team Eklavya", ["Cultural", "Social Welfare"], "Official street-play club using theatre to raise awareness on social issues.", ["Street Play", "Social Awareness", "Performance", "Social Issues"], "2017", null, "team.eklavya.official"],
    ["rangmanch", "Rangmanch", ["Media and Film", "Cultural"], "Film-making club for storytelling, cinema and creative video production.", ["Film-making", "Cinema", "Storytelling", "Creative Production"], null, null, null],
    ["light-lounge", "Light-Hearted Lounge", ["Cultural"], "Creative space for comedy, poetry, music and open-mic culture.", ["Stand-up Comedy", "Hip-hop", "Poetry", "Open Mics", "Art"], null, null, null],
    ["pi-editorial", "Pi Editorial Board", ["Media and Film", "Cultural"], "Literary and media club for college publications and creative content.", ["Writing", "Editing", "Journalism", "Design", "Poetry", "Magazine Production"], "1994", "Described in the directory as VIT Pune's oldest club", null],
    ["epec", "EPEC", ["Cultural"], "Event Planning and Execution Committee for major campus events and cultural activities.", ["Event Planning", "Cultural Fests", "Campus Events", "Event Management"], null, null, "vit_pune_official"],
    ["mun", "VIT Pune MUN", ["Public Speaking", "Cultural"], "Model United Nations conference for debate, diplomacy and international affairs.", ["Model UN", "Debate", "Diplomacy", "Public Speaking", "International Affairs"], "2026 edition publicly active", null, "vitpunemun2026"],
    ["zephyr", "Zephyr", ["Cultural"], "Official dance crew across hip-hop, classical, contemporary and street styles.", ["Hip-hop", "Classical", "Contemporary", "Street Dance", "Choreography", "Competitions"], null, "1st Runner-Up, Desi Beats at IIT Bombay Mood Indigo 2023; active competitor at the RevUp dance championship", "vit_zephyr"],
    ["aaroh", "Aaroh", ["Cultural"], "Official music club for singers, instrumentalists and bands.", ["Singing", "Instrumental Music", "Bands", "Live Performances", "Music Production"], "2020", null, "vit_aaroh"],
    ["veh", "Vishwakarma Expression Hub (VEH)", ["Cultural", "Design", "Media and Film"], "Official art and expression club: visual arts, literature, design, photography and video.", ["Art", "Literature", "Poetry", "Graphic Design", "Photography", "Videography", "Video Editing"], "2020", "450+ member creative community; organised Aurora with 399 attendees across four creative workshops", "vit_expression_hub"],
    ["abhivriddhi", "Abhivriddhi", ["Career Development"], "Student Training and Development Committee preparing students for placements and professional growth.", ["Training", "Career Counselling", "Corporate Readiness", "Skill Development"], null, null, null],
    ["pdc", "Personality Development Club (PDC)", ["Public Speaking"], "Confidence, communication and personality development: interviews, group discussions and etiquette.", ["Personality Development", "Etiquette", "Interviews", "Group Discussions", "Debates"], null, null, null],
    ["speakers", "Speaker's Club", ["Public Speaking"], "Helps students become confident speakers and debaters.", ["Public Speaking", "Debates", "Stage Presence", "Current Affairs", "Communication"], null, null, null],
    ["investment-forum", "The Investment Forum", ["Finance", "Entrepreneurship"], "Introduces students to finance, markets and investing.", ["Investment", "Finance", "Stocks", "Crypto", "Financial Markets"], null, null, null],
    ["vedc", "V-EDC – Entrepreneurship Development Cell", ["Entrepreneurship"], "Student-run cell supporting startup learning and founder engagement.", ["Entrepreneurship", "Startups", "Business Incubation", "Founder Sessions", "Venture Support"], "September 2013", null, "edcvit_"],
    ["swdc", "Social Welfare & Development Committee (SW&D)", ["Social Welfare"], "Social-impact committee: volunteering, awareness campaigns and community development.", ["Social Welfare", "Volunteering", "Awareness Campaigns", "Community Development"], null, null, null],
    ["chess", "Chess Champions Club", ["Sports"], "Chess community for casual and competitive players: practice, tournaments and strategy.", ["Chess", "Tournaments", "Strategy", "Workshops", "Competitions"], null, null, null],
    ["sports-teams", "VIT Pune Sports Teams & Activities", ["Sports"], "Institute-level indoor and outdoor sports with intercollegiate representation.", ["Cricket", "Football", "Basketball", "Tennis", "Swimming", "Badminton", "Athletics", "Martial Arts"], null, null, null]
  ];
  R.forEach(([id, name, category, description, domains, origin, achievement, instagram]) => {
    const patch = { name, category, description, activities: domains.slice(0, 6), domains, origin, achievement, listing: "directory" };
    const c = D.clubs.find((x) => x.id === id);
    if (c) { Object.assign(c, patch); if (instagram) c.instagram = instagram; }
    else D.clubs.push({ id, bestFor: "Students interested in " + domains.slice(0, 3).join(", "), instagram: instagram || "", website: "", tags: [], ...patch });
  });

  /* ---- Clubs from the original club list that are NOT in the directory PDF ----
     No source was found for these, so they are labelled "Not in directory" and show no invented details.
     To add real facts later, fill the object below (blank values are ignored). This is the only place to edit. */
  const ORIGINAL = ["acm-vit", "ieee-cs", "cyber-cell", "vicsta", "aisa", "compsa", "cesa", "mesa", "os-club", "byteforge", "cloudforge", "vcloudops", "hackathons-vit", "tech2product", "vishwa-racers", "auv"];
  const FILL = {
    // "acm-vit": { description: "", instagram: "", achievement: "", origin: "" },
  };
  const FAC = "https://facultyprofile.vit.edu/profile/21115"; // vit.edu faculty profile listing club-coordinator roles (checked 2026-10-31)
  ORIGINAL.forEach((id) => {
    const c = D.clubs.find((x) => x.id === id); if (!c) return;
    c.listing = "original"; c.activities = []; c.bestFor = "Check the club's own channels for details";
    c.description = "Listed in the original club list; details not yet documented.";
    const f = FILL[id] || {}; ["description", "instagram", "achievement", "origin"].forEach((k) => { if (f[k]) c[k] = f[k]; });
  });
  [["cyber-cell", "Cyber Cell VIT (VishwaCryptix)", "Cyber-security club listed on vit.edu as 'Cyber Cell VishwaCryptix'; activities not yet documented."], ["vicsta", "VICSTA", "Student club listed on vit.edu; activities not yet documented."]].forEach(([id, name, desc]) => {
    const c = D.clubs.find((x) => x.id === id); if (!c) return;
    c.name = name; c.description = desc; c.listing = null;
    c.verified = "2026-10-31"; c.source = FAC; c.statusLabel = "Club coordinator role listed on a vit.edu faculty profile";
    c.leadership = [{ name: "Prasad Bhata Chaudhari", role: "Faculty club coordinator (as listed)", tenure: null, source: FAC }];
  });

  // Corrections: earlier placeholder event organisers contradicted the directory.
  const ev = (id) => D.events.find((e) => e.id === id);
  if (ev("sports-events")) ev("sports-events").org = "Institute sports activities (organiser not verified)";
  if (ev("mun")) ev("mun").org = "VIT Pune MUN (2026 edition publicly active)";
})();
