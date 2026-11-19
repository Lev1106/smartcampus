import type { Room, Booking } from "@/types";

export const sampleRooms: Room[] = [
  { id: "r1", name: "Engineering Hall 101", building: "Engineering Block", capacity: 40, blocked: false },
  { id: "r2", name: "Science Building 220", building: "Science Block", capacity: 25, blocked: false },
  { id: "r3", name: "Library Study Room A", building: "Central Library", capacity: 12, blocked: false },
  { id: "r4", name: "Business Center 305", building: "Business Block", capacity: 30, blocked: true },
  { id: "r5", name: "Arts Studio 12", building: "Arts Wing", capacity: 20, blocked: false },
];

export const sampleBookings: Booking[] = [
  { id: "b1", roomId: "r1", start: 540, end: 600, title: "Calculus II", bookedBy: "Prof. Chen" },
  { id: "b2", roomId: "r1", start: 720, end: 780, title: "Physics Lab", bookedBy: "Prof. Rao" },
  { id: "b3", roomId: "r1", start: 900, end: 960, title: "Office Hours", bookedBy: "Prof. Chen" },
  { id: "b4", roomId: "r2", start: 600, end: 660, title: "Chemistry 101", bookedBy: "Prof. Lee" },
  { id: "b5", roomId: "r2", start: 840, end: 900, title: "Biology Seminar", bookedBy: "Prof. Park" },
  { id: "b6", roomId: "r3", start: 480, end: 540, title: "Reading Group", bookedBy: "Student Council" },
  { id: "b7", roomId: "r3", start: 780, end: 840, title: "Thesis Prep", bookedBy: "J. Martinez" },
  { id: "b8", roomId: "r5", start: 660, end: 720, title: "Painting Class", bookedBy: "Prof. Okafor" },
  { id: "b9", roomId: "r5", start: 960, end: 1020, title: "Sculpture Workshop", bookedBy: "Prof. Okafor" },
];
