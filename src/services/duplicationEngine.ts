import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Issue } from "../types";

/**
 * Checks for duplicate reports within 10 meters and same category.
 * If found, merges them into a Master Ticket.
 */
export const handleDuplication = async (newIssue: Omit<Issue, "id">): Promise<string | null> => {
  const issuesRef = collection(db, "issues");
  const q = query(
    issuesRef,
    where("category", "==", newIssue.category),
    where("status", "!=", "resolved")
  );

  const querySnapshot = await getDocs(q);
  const duplicates = querySnapshot.docs.filter(doc => {
    const data = doc.data() as Issue;
    const distance = calculateDistance(
      newIssue.location.lat,
      newIssue.location.lng,
      data.location.lat,
      data.location.lng
    );
    return distance <= 0.01; // 10 meters
  });

  if (duplicates.length > 0) {
    // Return the ID of the first duplicate to link as master
    return duplicates[0].id;
  }

  return null;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
