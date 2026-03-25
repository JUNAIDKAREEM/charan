import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Issue } from "../types";

/**
 * Identifies hotspots with high probability of failure based on report frequency.
 */
export const getPredictiveMaintenanceData = async () => {
  const issuesRef = collection(db, "issues");
  const querySnapshot = await getDocs(issuesRef);
  const issues = querySnapshot.docs.map(doc => doc.data() as Issue);

  const hotspots: { [key: string]: { count: number; lat: number; lng: number; category: string } } = {};

  issues.forEach(issue => {
    const key = `${issue.location.lat.toFixed(3)}_${issue.location.lng.toFixed(3)}`;
    if (!hotspots[key]) {
      hotspots[key] = { count: 0, lat: issue.location.lat, lng: issue.location.lng, category: issue.category };
    }
    hotspots[key].count += 1;
  });

  return Object.values(hotspots).filter(h => h.count >= 3); // Areas with 3+ reports
};
