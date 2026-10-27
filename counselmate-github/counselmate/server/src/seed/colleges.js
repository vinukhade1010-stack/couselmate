// SAMPLE DATA. Every college below is made up for demonstration.
// Names, fees, cutoffs and ratings are NOT real. Replace them with real, checked data
// from the admin panel (or edit this file and run  npm run seed  again).

const T = (s) => `B.Tech ${s}`;
const ENG = [T('Computer Science'), T('Information Technology'), T('Mechanical'), T('Civil'), T('Electronics')];

export const colleges = [
  // ---- Pune ----
  { name: 'Asha Valley Institute of Technology', city: 'Pune', state: 'Maharashtra', type: 'Autonomous', courses: ENG, fees: 185000, cutoff: 94, rating: 4.5, established: 1994, description: 'A sample autonomous engineering college with an active coding club and a strong placement cell.' },
  { name: 'Northstar College of Engineering', city: 'Pune', state: 'Maharashtra', type: 'Private', courses: [T('Computer Science'), T('Mechanical'), T('Electronics')], fees: 135000, cutoff: 86, rating: 4.1, established: 2001, description: 'A sample private college known for its workshop labs and industry visits.' },
  { name: 'Riverbend Institute of Management', city: 'Pune', state: 'Maharashtra', type: 'Private', courses: ['MBA', 'BBA'], fees: 210000, cutoff: 88, rating: 4.3, established: 1999, description: 'A sample management school with case-study based classes.' },
  { name: 'Lotus Government Polytechnic and College', city: 'Pune', state: 'Maharashtra', type: 'Government', courses: [T('Civil'), T('Mechanical')], fees: 42000, cutoff: 91, rating: 4.0, established: 1958, description: 'A sample government college with very low fees and a long history.' },
  { name: 'Greenfield College of Pharmacy', city: 'Pune', state: 'Maharashtra', type: 'Private', courses: ['B.Pharm'], fees: 98000, cutoff: 74, rating: 3.9, established: 2006, description: 'A sample pharmacy college with a research lab and hospital training.' },
  // ---- Mumbai / Navi Mumbai ----
  { name: 'Harbour Light University College', city: 'Mumbai', state: 'Maharashtra', type: 'Autonomous', courses: [T('Computer Science'), T('Information Technology'), T('Electronics'), 'BBA', 'B.Com'], fees: 165000, cutoff: 95, rating: 4.6, established: 1975, description: 'A sample city college with strong alumni connections.' },
  { name: 'Marine Drive College of Commerce', city: 'Mumbai', state: 'Maharashtra', type: 'Private', courses: ['B.Com', 'BBA', 'MBA'], fees: 78000, cutoff: 82, rating: 4.0, established: 1982, description: 'A sample commerce college with evening batches.' },
  { name: 'Palm Bay Institute of Technology', city: 'Navi Mumbai', state: 'Maharashtra', type: 'Private', courses: ENG, fees: 170000, cutoff: 80, rating: 3.8, established: 2004, description: 'A sample private college near the harbour line with modern labs.' },
  // ---- Nagpur / Nashik / Kolhapur / others in Maharashtra ----
  { name: 'Orange City Engineering Academy', city: 'Nagpur', state: 'Maharashtra', type: 'Private', courses: [T('Computer Science'), T('Civil'), T('Mechanical')], fees: 105000, cutoff: 72, rating: 3.7, established: 2002, description: 'A sample private college with an affordable fee structure.' },
  { name: 'Vidarbha Government Medical Institute', city: 'Nagpur', state: 'Maharashtra', type: 'Government', courses: ['MBBS'], fees: 95000, cutoff: 99, rating: 4.7, established: 1968, description: 'A sample government medical college. Admission is highly competitive.' },
  { name: 'Godavari Institute of Science', city: 'Nashik', state: 'Maharashtra', type: 'Autonomous', courses: ['B.Sc Computer Science', 'B.Sc Physics', 'B.Sc Chemistry', 'BCA'], fees: 56000, cutoff: 70, rating: 4.0, established: 1990, description: 'A sample science college with a large library and field trips.' },
  { name: 'Panchganga College of Technology', city: 'Kolhapur', state: 'Maharashtra', type: 'Private', courses: [T('Mechanical'), T('Civil'), T('Computer Science')], fees: 88000, cutoff: 68, rating: 3.8, established: 1998, description: 'A sample college known for its mechanical and foundry labs.' },
  { name: 'Krishna Valley Law College', city: 'Sangli', state: 'Maharashtra', type: 'Private', courses: ['LLB'], fees: 45000, cutoff: 65, rating: 3.6, established: 1992, description: 'A sample law college with a moot court hall.' },
  { name: 'Sambhaji Nagar School of Architecture', city: 'Aurangabad', state: 'Maharashtra', type: 'Private', courses: ['B.Arch'], fees: 140000, cutoff: 78, rating: 4.0, established: 2008, description: 'A sample architecture school with a design studio and heritage-site visits.' },
  { name: 'Solapur Institute of Management Studies', city: 'Solapur', state: 'Maharashtra', type: 'Private', courses: ['MBA', 'BBA', 'BCA'], fees: 72000, cutoff: 60, rating: 3.5, established: 2010, description: 'A sample management institute with a small batch size.' },
  { name: 'Satara Hills Agricultural and Science College', city: 'Satara', state: 'Maharashtra', type: 'Government', courses: ['B.Sc Agriculture', 'B.Sc Chemistry'], fees: 38000, cutoff: 62, rating: 3.9, established: 1972, description: 'A sample government college with its own demonstration farm.' },
  // ---- Other states ----
  { name: 'Silicon Plateau Institute of Technology', city: 'Bengaluru', state: 'Karnataka', type: 'Autonomous', courses: [T('Computer Science'), T('Information Technology'), T('Electronics')], fees: 240000, cutoff: 97, rating: 4.8, established: 1986, description: 'A sample autonomous college in a technology city, with internships built into the course.' },
  { name: 'Lakeside College of Business', city: 'Bengaluru', state: 'Karnataka', type: 'Private', courses: ['MBA', 'BBA'], fees: 260000, cutoff: 90, rating: 4.4, established: 2000, description: 'A sample business school with a startup incubator.' },
  { name: 'Charminar Technical University College', city: 'Hyderabad', state: 'Telangana', type: 'Private', courses: ENG, fees: 150000, cutoff: 83, rating: 4.1, established: 1997, description: 'A sample private university college with a large campus.' },
  { name: 'Sabarmati Institute of Design and Technology', city: 'Ahmedabad', state: 'Gujarat', type: 'Autonomous', courses: [T('Civil'), T('Mechanical'), 'B.Arch'], fees: 175000, cutoff: 85, rating: 4.2, established: 1989, description: 'A sample institute known for design projects.' },
  { name: 'Malwa Plains Commerce and Science College', city: 'Indore', state: 'Madhya Pradesh', type: 'Government', courses: ['B.Com', 'B.Sc Computer Science', 'BCA'], fees: 34000, cutoff: 66, rating: 3.8, established: 1965, description: 'A sample government college with low fees.' },
  { name: 'Coastal Breeze College of Pharmacy', city: 'Bengaluru', state: 'Karnataka', type: 'Private', courses: ['B.Pharm'], fees: 125000, cutoff: 76, rating: 4.0, established: 2007, description: 'A sample pharmacy college with industry partnerships.' },
  { name: 'Deccan Heritage Medical College', city: 'Hyderabad', state: 'Telangana', type: 'Private', courses: ['MBBS'], fees: 1150000, cutoff: 91, rating: 4.3, established: 2003, description: 'A sample private medical college with a teaching hospital.' },
].map((c) => ({ ...c, isSample: true }));
