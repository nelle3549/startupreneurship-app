// Lesson 1 Activities (All Levels) — MCQ + Wordle pools

const MCQ_POOLS = {
  "grade-4": [
    { q:"What is the primary goal of social entrepreneurship?", options:["Maximizing profit margins","Creating positive social or environmental impact","Competing with traditional businesses","Attracting investors"], answer:1 },
    { q:"Social entrepreneurs use ___ to address pressing societal problems.", options:["Government funding","Traditional business models","Innovative solutions","Corporate partnerships"], answer:2 },
    { q:"What distinguishes social entrepreneurship from traditional entrepreneurship?", options:["Focus solely on financial gains","Emphasis on market competition","Prioritization of social and environmental value alongside financial value","Exclusive focus on environmental issues"], answer:2 },
    { q:"Which stakeholders do social entrepreneurs primarily consider?", options:["Only investors","Only shareholders","Only beneficiaries","Beneficiaries, communities, environment, investors, and shareholders"], answer:3 },
    { q:"Which is NOT a key element of successful social entrepreneurship?", options:["A clear social mission","Innovation","Maximizing short-term profits","Measurable impact"], answer:2 },
    { q:"What guides a social entrepreneurship venture's activities?", options:["Stock market trends","Competitor strategies","A well-defined mission","Government regulations"], answer:2 },
    { q:"For long-lasting change, social entrepreneurship must focus on:", options:["Short-term gains","Scalability and sustainability","Marketing only","Competition elimination"], answer:1 },
    { q:"Why do social entrepreneurs measure their impact?", options:["To attract more investors","To comply with regulations","To ensure effective addressing of targeted issues","To compete with others"], answer:2 },
    { q:"Social entrepreneurship combines:", options:["Profit and loss","Marketing and sales","Innovation and growth mindset with positive social impact","Government and private sector"], answer:2 },
    { q:"Social entrepreneurs often work in:", options:["Only profitable markets","Areas where traditional businesses and government have failed","Exclusively in technology","Only in developed countries"], answer:1 },
  ],
  "grade-5": [
    { q:"What is creativity primarily described as?", options:["A skill only artists possess","A magic wand that unlocks new ideas and solutions","A talent for painting and writing","A tool exclusive to inventors"], answer:1 },
    { q:"Who is Illac Diaz?", options:["A Filipino artist","A game designer","A Filipino social entrepreneur","A lighting engineer"], answer:2 },
    { q:"What did Illac Diaz create?", options:["Solar panels","Electric bulbs","Light using plastic bottles with water and bleach","Battery-powered lamps"], answer:2 },
    { q:"How should we view mistakes?", options:["As failures to avoid","As learning opportunities","As embarrassing moments","As problems to ignore"], answer:1 },
    { q:"In which field is creativity NOT mentioned as useful?", options:["Science","Technology","Fashion","Engineering"], answer:2 },
    { q:"What is one way to foster creativity?", options:["Working alone","Avoiding challenges","Staying curious","Following strict rules"], answer:2 },
    { q:"How is creativity described in problem-solving?", options:["As the only solution","As a last resort","As a way to think differently","As unnecessary"], answer:2 },
    { q:"What does the text suggest about creative ability?", options:["Only some people have it","It can't be learned","Everyone has this ability","It's only for professionals"], answer:2 },
    { q:"How can creativity help in cooking?", options:["By following recipes exactly","By creating dishes with limited ingredients","By ordering takeout","By buying more ingredients"], answer:1 },
    { q:"What is emphasized as important for becoming more creative?", options:["Having special talents","Being perfect","Keeping an open mind","Working harder"], answer:2 },
  ],
  "grade-6": [
    { q:"What is empathy?", options:["The ability to solve mathematical problems","The ability to understand and share the feelings of others","The ability to speak multiple languages","The ability to make quick decisions"], answer:1 },
    { q:"Which best describes the role of empathy in business?", options:["It only helps in personal relationships","It's unnecessary for business success","It helps understand customers, colleagues, and competitors better","It's only important for customer service"], answer:2 },
    { q:"How does empathy contribute to innovation?", options:["It makes products more expensive","It helps in understanding and solving user problems","It slows down development","It reduces profits"], answer:1 },
    { q:"What characterizes an empathetic leader?", options:["Someone who never listens","Someone who only focuses on profits","Someone who creates a supportive environment","Someone who ignores issues"], answer:2 },
    { q:"How does empathy help in customer service?", options:["It makes service slower","It helps representatives better understand and solve problems","It increases costs","It's not important"], answer:1 },
    { q:"Which company was mentioned as using empathy to disrupt their industry?", options:["Microsoft","Google","Apple","Samsung"], answer:2 },
    { q:"In product development, empathy helps by:", options:["Making products expensive","Understanding user needs and experiences","Reducing development time","Ignoring feedback"], answer:1 },
    { q:"What is the result of empathetic leadership?", options:["Lower productivity","Increased conflicts","Higher job satisfaction and productivity","Reduced communication"], answer:2 },
    { q:"How can empathy help in communication?", options:["By making messages complex","By ignoring perspectives","By tailoring messages to resonate with others","By using technical language only"], answer:2 },
    { q:"What is an example of empathy in action?", options:["Ignoring a complaint","Refusing to help","Understanding why a friend is upset about failing a test","Making decisions without considering others"], answer:2 },
  ],
  "grade-7": [
    { q:"What is the basic definition of an idea?", options:["A physical object","A thought or collection of thoughts generated in the mind","A written document","A verbal conversation"], answer:1 },
    { q:"Ideas in entrepreneurship primarily serve as:", options:["Entertainment only","A way to spend free time","The foundation of startups and businesses","A method of communication"], answer:2 },
    { q:"The journey of an idea can be compared to:", options:["A rock formation","A chemical reaction","The growth of a plant","A mathematical equation"], answer:2 },
    { q:"In the digital age, what plays a vital role?", options:["Physical stores","Computers and technology","Traditional mail","Face-to-face meetings only"], answer:1 },
    { q:"What is the first stage in the journey of an idea?", options:["Implementation","Marketing","A spark of imagination or curiosity","Financial planning"], answer:2 },
    { q:"How do challenges affect ideas?", options:["They always destroy ideas","They have no effect","They help refine and improve ideas","They only create confusion"], answer:2 },
    { q:"What is needed to nurture an idea?", options:["Money only","Luck","Reading, research, questions, and advice","Social media followers"], answer:2 },
    { q:"In entrepreneurship, an idea typically starts with:", options:["Identifying a need or problem","Creating a logo","Opening a bank account","Hiring employees"], answer:0 },
    { q:"Ideas can be used to:", options:["Only create new products","Only improve existing systems","Both create new products and improve existing systems","Neither"], answer:2 },
    { q:"The final stage of an idea's journey is:", options:["Thinking about it","Discussing it with friends","Writing it down","Turning it into reality"], answer:3 },
  ],
  "grade-8": [
    { q:"Which phase involves conceiving and validating a unique business idea?", options:["Building Phase","Ideation Phase","Launch Phase","Growth Phase"], answer:1 },
    { q:"What is a startup primarily characterized by?", options:["Large workforce","Stable revenue","Innovation and high growth potential","Traditional approaches"], answer:2 },
    { q:"During which phase does a startup develop its product?", options:["Building Phase","Maturity Phase","Exit Phase","Ideation Phase"], answer:0 },
    { q:"What is critical in the Launch Phase?", options:["Conducting market research","Developing a prototype","Creating a go-to-market strategy","Establishing brand presence"], answer:2 },
    { q:"Which is a key element of a successful startup?", options:["Large office space","Multiple product lines","Passionate and capable team","Immediate profitability"], answer:2 },
    { q:"During the Growth Phase, what is important?", options:["Initial idea validation","Monitoring KPIs and progress","Product development","Market research"], answer:1 },
    { q:"What characterizes the Maturity Phase?", options:["Rapid growth","Initial product development","Stabilized growth and established market presence","Idea validation"], answer:2 },
    { q:"What type of funding do startups initially rely on?", options:["Bank loans","Government grants","Founder funding","Public offerings"], answer:2 },
    { q:"Which phase might result in exit or closure?", options:["Launch Phase","Growth Phase","Exit or Decline Phase","Building Phase"], answer:2 },
    { q:"What is essential for startups to maintain?", options:["Fixed business model","Culture of learning and adaptability","Single product focus","Traditional management"], answer:1 },
  ],
  "grade-9": [
    { q:"What is marketing primarily concerned with?", options:["Only creating advertisements","Understanding customer needs and shaping product perception","Designing logos","Selling products at lowest price"], answer:1 },
    { q:"Which is NOT part of a robust marketing strategy?", options:["Branding","Public relations","Manufacturing","Digital marketing"], answer:2 },
    { q:"Who is Caya?", options:["A marketing professor","The CEO of a venture-funded startup","A public relations expert","A growth hacking consultant"], answer:1 },
    { q:"The primary goal of marketing in business growth?", options:["Just raising funding","Only increasing social media followers","Expanding customer base and building brand loyalty","Reducing production costs"], answer:2 },
    { q:"What does unit economics help measure?", options:["Employee satisfaction","Product quality","Cost of acquisition and customer lifetime value","Market size only"], answer:2 },
    { q:"What characterizes a growth hacking mindset?", options:["Being rigid","Focusing only on social media","Being agile, innovative, and data-driven","Avoiding all risks"], answer:2 },
    { q:"Market segmentation is based on:", options:["Only demographics","Only geography","Only behavior","Multiple factors including demographic, geographic, psychographic, and behavioral"], answer:3 },
    { q:"What is the purpose of a value proposition?", options:["To list all features","To articulate unique product value and differentiation","To set prices","To manage employee relations"], answer:1 },
    { q:"During bootstrap phase, growth is linked to:", options:["Marketing budget","The product itself","Social media presence","Number of employees"], answer:1 },
    { q:"Marketing strategies in early stages should reflect:", options:["Only current state","Only future plans","Both current state and projected evolution","Competitor strategies only"], answer:2 },
  ],
  "grade-10": [
    { q:"What is the earliest stage of startup funding?", options:["Series A","Pre-Seed Funding","Seed Funding","IPO"], answer:1 },
    { q:"In 2022, average Series A funding round was?", options:["$33 million","$40 million","$23 million","$2 million"], answer:2 },
    { q:"Which funding stage involves hedge funds and investment banks?", options:["Series A","Series B","Series C","Pre-Seed"], answer:2 },
    { q:"Typical seed funding pre-money valuation range?", options:["$24-30 million","$40-50 million","$3-6 million","$10-15 million"], answer:2 },
    { q:"Typical pre-seed investors?", options:["VC firms only","Investment banks","Founders, friends, and family","Hedge funds"], answer:2 },
    { q:"Average Series B funding amount in 2020?", options:["$23 million","$33 million","$59 million","$40 million"], answer:1 },
    { q:"When a private company's shares are offered publicly, it's called:", options:["Series C","Angel Investment","Initial Public Offering","Seed Funding"], answer:2 },
    { q:"Angel investors are typically:", options:["Bank executives","Government officials","Successful entrepreneurs","Corporate employees"], answer:2 },
    { q:"How many funding rounds before an IPO?", options:["Two","Three","Four","Five"], answer:1 },
    { q:"Average Series C pre-money valuation in 2022?", options:["$40 million","$59 million","$68 million","$24 million"], answer:2 },
  ],
  "grade-11": [
    { q:"Which government agency provides business advisory services in the Philippines?", options:["Dept of Education","Dept of Trade and Industry","Dept of Labor","Dept of Science and Technology"], answer:1 },
    { q:"What are Negosyo Centers designed to be?", options:["Shopping centers","Manufacturing hubs","One-stop shops for entrepreneurs","Tourist information centers"], answer:2 },
    { q:"Which is NOT a private organization supporting entrepreneurs in PH?", options:["IdeaSpace","Kickstart Ventures","Silicon Valley Hub","QBO Innovation Hub"], answer:2 },
    { q:"What type of support do mentors provide?", options:["Financial only","Marketing only","Technical only","Guidance to avoid pitfalls and refine strategies"], answer:3 },
    { q:"Which online platform is mentioned for networking in PH?", options:["LinkedIn","Twitter","Startup PH on Facebook","Instagram Business"], answer:2 },
    { q:"Why are supportive networks important?", options:["To provide entertainment","To handle all operations","To navigate challenges and grow businesses","To replace education"], answer:2 },
    { q:"What makes entrepreneurship challenging for newcomers?", options:["Lack of ideas","Too much competition","Risks and challenges that require support","Limited markets"], answer:2 },
    { q:"How do co-working spaces benefit entrepreneurs?", options:["Free office supplies","Free internet only","Fostering networking and collaborative opportunities","Guaranteeing success"], answer:2 },
    { q:"What is described as indispensable in both personal and professional life?", options:["Money","Social connectivity","Technology","Competition"], answer:1 },
    { q:"Which best describes PH entrepreneurial support system?", options:["Government-only","Private sector exclusive","Combination of government, private initiatives, and online platforms","International-led"], answer:2 },
  ],
  "grade-12": [
    { q:"Which best describes the role of passion in entrepreneurial success?", options:["It is solely responsible","It serves as the energy that fuels the journey toward success","It only matters initially","It replaces hard work"], answer:1 },
    { q:"Grit in entrepreneurship can be compared to:", options:["A magic wand","A temporary boost","Sandpaper in woodworking","A one-time achievement"], answer:2 },
    { q:"How is resilience developed?", options:["Through inheritance","Through a single success","Through trial and error, repeated failures and successes","Through reading books"], answer:2 },
    { q:"The relationship between passion, grit, and resilience?", options:["They work independently","They compete","They complement each other in achieving success","Only one is necessary"], answer:2 },
    { q:"Which best describes the development of grit?", options:["It happens overnight","It requires daily practice and deliberate actions","It depends on natural talent","It cannot be developed"], answer:1 },
    { q:"Resilience primarily helps with:", options:["Avoiding all challenges","Giving up","Weathering storms and bouncing back from failures","Maintaining the status quo"], answer:2 },
    { q:"Passion helps entrepreneurs to:", options:["Avoid all mistakes","Stay focused and positive despite setbacks","Guarantee immediate success","Eliminate learning"], answer:1 },
    { q:"Grit functions as:", options:["A replacement for skills","An armor that protects during hardship","A substitute for experience","A temporary solution"], answer:1 },
    { q:"What role does resilience play in organizational success?", options:["It prevents all failures","It eliminates the need for adaptation","It serves as a crucial organizational asset","It replaces planning"], answer:2 },
    { q:"The development of resilience is compared to:", options:["Reading a book","Weight lifting","Walking in a park","Taking a vacation"], answer:1 },
  ],
  "college-1": [
    { q:"What is entrepreneurial leadership primarily focused on?", options:["Only managing resources","Organizing and motivating teams through innovation and risk optimization","Following corporate structures strictly","Avoiding all risks"], answer:1 },
    { q:"Which is NOT a key trait of entrepreneurial leadership?", options:["Effective communication","Financial expertise","Self-belief","Being supportive"], answer:1 },
    { q:"What is a main challenge in entrepreneurial leadership?", options:["Having too many resources","Cultivating an entrepreneurial mindset in a traditional team","Working too efficiently","Having too many innovative ideas"], answer:1 },
    { q:"Which characteristics are essential for navigating challenges?", options:["Resilience, adaptability, and commitment to vision","Stubbornness","Following orders without question","Avoiding all changes"], answer:0 },
    { q:"What is a key characteristic for remaining strong as a leader?", options:["Avoiding all risks","Working alone","Perseverance","Following traditional methods only"], answer:2 },
    { q:"A benefit of entrepreneurial leadership?", options:["Decreased responsibility","Increased team motivation and innovation","Elimination of all risks","Reduced need for communication"], answer:1 },
    { q:"What is essential for growth in entrepreneurial leadership?", options:["Strict hierarchical structure","Individual work only","Avoiding collaboration","Sharing success and being involved"], answer:3 },
    { q:"What trait is crucial for long-term success?", options:["Resistance to change","Commitment to lifelong learning","Working in isolation","Avoiding challenges"], answer:1 },
    { q:"How does entrepreneurial leadership differ?", options:["It focuses only on profit","It avoids all risks","It emphasizes risk management and adaptability","It follows strict hierarchies"], answer:2 },
    { q:"What motivates a team in entrepreneurial leadership?", options:["Individual competition only","Avoiding innovation","Clear vision and effective communication","Strict control measures"], answer:2 },
  ],
  "college-2": [
    { q:"What is technopreneurship?", options:["The study of technology only","A combination of technology and entrepreneurship focused on innovation","Traditional business management","Selling technological products"], answer:1 },
    { q:"Technopreneurs are characterized as individuals who:", options:["Only develop software","Avoid using technology","Leverage technology to create and enhance business models","Focus solely on traditional methods"], answer:2 },
    { q:"A key element in demonstrating readiness for technopreneurship?", options:["Avoiding all technological changes","Focusing only on traditional practices","Embracing technology and its business applications","Working exclusively in IT"], answer:2 },
    { q:"Why can technopreneurship be challenging?", options:["It requires no skills","It involves constant change and rapid technological advancement","It has no competition","It requires no investment"], answer:1 },
    { q:"The primary role of technology in technopreneurship?", options:["To complicate processes","To serve as a tool for facilitating and managing business activities","To replace human workers entirely","To increase costs"], answer:1 },
    { q:"What is essential for success in technopreneurship?", options:["Avoiding all risks","Ignoring advances","Continuous learning and perseverance","Following traditional models only"], answer:2 },
    { q:"How do technopreneurs create value?", options:["By avoiding innovation","By copying existing models","By disrupting traditional industries and creating new opportunities","By ignoring market trends"], answer:2 },
    { q:"A key benefit of technopreneurship to society?", options:["Maintaining status quo","Reducing advancement","Creating positive change through innovation","Eliminating traditional businesses"], answer:2 },
    { q:"What skill is most important for a technopreneur?", options:["Resistance to change","Adaptability","Avoiding technology","Following others' lead only"], answer:1 },
    { q:"Recommended approach to technological complexity?", options:["Avoid it completely","Outsource everything","Embrace and learn to use it effectively","Ignore advances"], answer:2 },
  ],
  "college-3": [
    { q:"What is the first step in product development?", options:["Creating a prototype","Building the actual product","Identifying the need and defining your target customer","Launching the product"], answer:2 },
    { q:"Which is NOT a benefit of structured product development?", options:["A clear roadmap","Immediate profit","Stakeholder involvement","Continuous measurement"], answer:1 },
    { q:"When researching the market, focus on:", options:["Only your product features","Marketing strategies","Analyzing existing solutions and competitors","Product pricing"], answer:2 },
    { q:"Recommended approach when creating a prototype?", options:["Launch immediately","Keep it confidential","Get feedback and make necessary changes","Avoid modifications"], answer:2 },
    { q:"During the build phase, what is crucial?", options:["Maximum speed","Quality control","Minimum costs","Marketing plans"], answer:1 },
    { q:"After launching your product, what should you do?", options:["Stop all development","Monitor performance and track metrics","Ignore customer feedback","Start a new product immediately"], answer:1 },
    { q:"How should you handle user feedback?", options:["Ignore it completely","Only consider positive feedback","Use it to make continuous improvements","Wait until the final launch"], answer:2 },
    { q:"Purpose of market research in product development?", options:["To copy competitors","To identify gaps and understand competition","To determine product price only","To plan marketing campaigns"], answer:1 },
    { q:"When conceiving a solution, the first step is:", options:["Start manufacturing","Launch marketing","Brainstorm multiple ideas","Set the final price"], answer:2 },
    { q:"What characterizes successful product development?", options:["Rigid adherence to plans","Avoiding changes","Flexibility and continuous improvement","Minimal stakeholder involvement"], answer:2 },
  ],
  "college-4": [
    { q:"Number of registered startups in PH as of 2021?", options:["Over 200","Over 300","Over 400","Over 500"], answer:2 },
    { q:"Where are most Philippine startups located?", options:["Davao","Cebu","Metro Manila","Baguio"], answer:2 },
    { q:"Which is NOT a factor in PH startup growth?", options:["Large young population","Strategic location","High-speed internet infrastructure","Availability of funding"], answer:2 },
    { q:"What service does PayMongo provide?", options:["Agricultural solutions","Educational platform","Online payment solutions","AI services"], answer:2 },
    { q:"Which startup connects farmers with investors?", options:["Senti AI","PayMongo","Edukasyon.ph","Cropital"], answer:3 },
    { q:"Which agency launched the 'Innovative Startup Program'?", options:["DTI","DICT","DOST","None"], answer:1 },
    { q:"What does Senti AI specialize in?", options:["Online payments","NLP and sentiment analysis","Agricultural technology","Educational services"], answer:1 },
    { q:"Which event showcases PH's most innovative startups?", options:["Philippine Innovation Week","Startup Manila Conference","Philippine Startup Week","Tech Summit Philippines"], answer:2 },
    { q:"Which department provides the Startup Research Grant?", options:["DICT","DTI","DOST","DFA"], answer:2 },
    { q:"What does Edukasyon.ph provide?", options:["Financial services","Agricultural support","Online platform for college search and applications","AI solutions"], answer:2 },
  ],
};

// Wordle pools: only for Grade 5+ (grade-5 through college-4)
const WORDLE_POOLS = {
  "grade-4": [
    { word: "IDEAS", hint: "New thoughts used to solve problems" },
    { word: "SERVE", hint: "To help others or the community" },
    { word: "CAUSE", hint: "A social or environmental problem" },
    { word: "VALUE", hint: "The good created for people or the planet" },
    { word: "REACH", hint: "Helping more people or spreading help further" },
  ],
  "grade-5": [
    { word: "SPARK", hint: "A small idea that starts something new" },
    { word: "DREAM", hint: "An idea you imagine for the future" },
    { word: "NOVEL", hint: "New or different from before" },
    { word: "CRAFT", hint: "To make something with care" },
    { word: "WIDEN", hint: "To make ideas bigger or broader" },
  ],
  "grade-6": [
    { word: "CARES", hint: "Showing concern for others" },
    { word: "FEELS", hint: "Understanding emotions" },
    { word: "SHOES", hint: "Seeing life from another's view" },
    { word: "TRUST", hint: "Confidence built through empathy" },
    { word: "LISTN", hint: "Paying close attention to others" },
  ],
  "grade-7": [
    { word: "IDEAS", hint: "Thoughts that can become plans or solutions" },
    { word: "SPARK", hint: "A sudden start of inspiration" },
    { word: "SEEDS", hint: "Small beginnings that can grow into big outcomes" },
    { word: "THINK", hint: "To use your mind to form thoughts" },
    { word: "GROWS", hint: "Develops and becomes stronger over time" },
  ],
  "grade-8": [
    { word: "START", hint: "The beginning stage of a new venture" },
    { word: "MODEL", hint: "The way a business works and earns" },
    { word: "PHASE", hint: "A step or stage in a process" },
    { word: "RAPID", hint: "Fast-moving growth or progress" },
    { word: "RISKY", hint: "Involving uncertainty and possible loss" },
  ],
  "grade-9": [
    { word: "AWARE", hint: "Being informed that something exists" },
    { word: "BRAND", hint: "The identity people recognize and remember" },
    { word: "NICHE", hint: "A focused group of customers in a market" },
    { word: "REACH", hint: "How many people your message gets to" },
    { word: "CRAFT", hint: "To carefully create and shape something" },
  ],
  "grade-10": [
    { word: "ANGEL", hint: "An early investor who uses personal money" },
    { word: "RAISE", hint: "To collect funds to support growth" },
    { word: "FUNDS", hint: "Money set aside for a purpose" },
    { word: "ROUND", hint: "A stage of fundraising" },
    { word: "SHARE", hint: "A unit of ownership in a company" },
  ],
  "grade-11": [
    { word: "PEERS", hint: "People at your level who support and challenge you" },
    { word: "GUIDE", hint: "To help someone move in the right direction" },
    { word: "BOOST", hint: "To increase confidence or progress" },
    { word: "FORUM", hint: "A group space for sharing advice and ideas" },
    { word: "HELPS", hint: "Support that makes hard tasks easier" },
  ],
  "grade-12": [
    { word: "DRIVE", hint: "Inner push to keep pursuing goals" },
    { word: "GRIND", hint: "Steady effort through difficulty" },
    { word: "ARMOR", hint: "Protective strength during hard times" },
    { word: "RESET", hint: "To recover and start again after setbacks" },
    { word: "BRAVE", hint: "Willing to face challenges despite fear" },
  ],
  "college-1": [
    { word: "LEADS", hint: "Guides others forward" },
    { word: "TEAMS", hint: "Groups working together" },
    { word: "TRUST", hint: "Confidence in someone" },
    { word: "ADAPT", hint: "Adjust to change" },
    { word: "RISKY", hint: "Involving possible loss" },
  ],
  "college-2": [
    { word: "START", hint: "Begin an effort" },
    { word: "TOOLS", hint: "Helpful things you use" },
    { word: "LEVER", hint: "Use an advantage well" },
    { word: "SKILL", hint: "Ability gained by practice" },
    { word: "LEARN", hint: "Gain new knowledge" },
  ],
  "college-3": [
    { word: "BUILD", hint: "To create or develop something" },
    { word: "TESTS", hint: "Trials to check performance" },
    { word: "IDEAS", hint: "New thoughts or concepts" },
    { word: "VALUE", hint: "Usefulness to customers" },
    { word: "LEARN", hint: "Gaining knowledge from results" },
  ],
  "college-4": [
    { word: "SCALE", hint: "Grow efficiently" },
    { word: "FOCUS", hint: "Concentrate on priorities" },
    { word: "CYCLE", hint: "Repeated process" },
    { word: "ADAPT", hint: "Change based on feedback" },
    { word: "SOLVE", hint: "Fix a real problem" },
  ],
};

// Wordle is for Grade 5+ only (but we have Grade 4 words from the PDF for the Wordle activity)
// Actually the PDF says "Wordle: Only for Grade 5+" but Grade 4 has Wordle words listed.
// Per the features PDF: "Wordle requirements: Only for Grade 5+"
// So we should only enable Wordle for grade-5 and above.

function hasWordle(yearLevelKey) {
  // Grade 5+ and all college levels
  const gradeNum = parseInt(yearLevelKey.replace("grade-",""));
  if (!isNaN(gradeNum) && gradeNum >= 5) return true;
  if (yearLevelKey.startsWith("college-")) return true;
  return false;
}

function pickRandomMCQ(yearLevelKey, count = 5) {
  const pool = MCQ_POOLS[yearLevelKey] || [];
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function pickRandomWordle(yearLevelKey, usedWords = [], count = 2) {
  const pool = WORDLE_POOLS[yearLevelKey] || [];
  const available = pool.filter(w => !usedWords.includes(w.word));
  const source = available.length >= count ? available : pool;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, source.length));
}

export { MCQ_POOLS, WORDLE_POOLS, hasWordle, pickRandomMCQ, pickRandomWordle };