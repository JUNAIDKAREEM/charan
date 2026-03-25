import { Issue } from "../types";

export const SAMPLE_ISSUES: Issue[] = [
  {
    id: "demo-1",
    title: "Large Pothole on MG Road",
    description: "A deep pothole is causing traffic delays and safety concerns for two-wheelers.",
    category: "Pothole",
    status: "pending",
    urgency: "high",
    location: { lat: 18.5204, lng: 73.8567, address: "MG Road, Pune" },
    reporterId: "demo-user",
    reporterName: "Demo Citizen",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    rewardPoints: 10,
    mediaUrl: "https://picsum.photos/seed/pothole/800/600",
    mediaType: "image",
    contactNumber: "9876543210",
    assignedDepartment: "PWD",
    aiAnalysis: {
      summary: "Significant road damage detected on a major thoroughfare.",
      suggestedDepartment: "PWD"
    }
  },
  {
    id: "demo-2",
    title: "Overflowing Garbage Bin",
    description: "Garbage hasn't been collected for 3 days. Foul smell in the area.",
    category: "Garbage",
    status: "in-progress",
    urgency: "medium",
    location: { lat: 18.5224, lng: 73.8587, address: "Kothrud, Pune" },
    reporterId: "demo-user",
    reporterName: "Demo Citizen",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 43200000,
    rewardPoints: 10,
    mediaUrl: "https://picsum.photos/seed/garbage/800/600",
    mediaType: "image",
    contactNumber: "9876543211",
    assignedDepartment: "Municipal Corp",
    aiAnalysis: {
      summary: "Waste management issue requiring immediate collection.",
      suggestedDepartment: "Municipal Corp"
    }
  },
  {
    id: "demo-3",
    title: "Broken Streetlight",
    description: "The entire lane is dark at night. Safety risk for pedestrians.",
    category: "Street Light",
    status: "resolved",
    urgency: "medium",
    location: { lat: 18.5184, lng: 73.8547, address: "Shivajinagar, Pune" },
    reporterId: "demo-user",
    reporterName: "Demo Citizen",
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 86400000,
    rewardPoints: 10,
    mediaUrl: "https://picsum.photos/seed/light/800/600",
    mediaType: "image",
    contactNumber: "9876543212",
    assignedDepartment: "Power Dept",
    fixedMediaUrl: "https://picsum.photos/seed/fixed-light/800/600",
    aiAnalysis: {
      summary: "Illumination failure in residential area.",
      suggestedDepartment: "Power Dept"
    }
  }
];
