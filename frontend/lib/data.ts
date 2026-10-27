export type Attendee = { id: string; name: string; email: string; company: string; ticket: string; status: 'Registered'|'Checked in'; checkedInAt?: string; code: string };
export type EventInfo = { id: string; name: string; date: string; venue: string; status: string; capacity: number };
export const seedEvents: EventInfo[] = [
 {id:'evt-001',name:'Future of Work Summit',date:'2026-11-18',venue:'Bengaluru International Exhibition Centre',status:'Upcoming',capacity:500},
 {id:'evt-002',name:'Product Leaders Meetup',date:'2026-12-04',venue:'The Leela Palace, Bengaluru',status:'Draft',capacity:180},
 {id:'evt-003',name:'Design Systems Day',date:'2026-09-12',venue:'The Lalit, Kolkata',status:'Completed',capacity:250}
];
export const seedAttendees: Attendee[] = [
 {id:'att-101',name:'Aarav Mehta',email:'aarav@example.com',company:'Northstar Labs',ticket:'General',status:'Checked in',checkedInAt:'09:12 AM',code:'EP-7F3A21'},
 {id:'att-102',name:'Priya Sharma',email:'priya@example.com',company:'Cloudnine',ticket:'VIP',status:'Registered',code:'EP-8B4D19'},
 {id:'att-103',name:'Rohan Das',email:'rohan@example.com',company:'Brightside',ticket:'General',status:'Checked in',checkedInAt:'09:24 AM',code:'EP-2C9E51'},
 {id:'att-104',name:'Ishita Roy',email:'ishita@example.com',company:'Studio Mint',ticket:'Speaker',status:'Registered',code:'EP-6A1F83'},
 {id:'att-105',name:'Kabir Nair',email:'kabir@example.com',company:'Orbit AI',ticket:'General',status:'Registered',code:'EP-4D7B20'},
 {id:'att-106',name:'Ananya Sen',email:'ananya@example.com',company:'Paperplane',ticket:'VIP',status:'Registered',code:'EP-9E2A47'},
 {id:'att-107',name:'Dev Patel',email:'dev@example.com',company:'Mosaic Tech',ticket:'General',status:'Registered',code:'EP-1B5C68'},
 {id:'att-108',name:'Mira Kapoor',email:'mira@example.com',company:'Foundry',ticket:'Speaker',status:'Checked in',checkedInAt:'09:38 AM',code:'EP-3A8D14'}
];
