import api from "./api";

export const getIPOs = (status) => {
  const q = status ? `?status=${status}` : "";
  return api.get(`/ipo${q}`);
};

export const getIPOApplications = () => {
  return api.get("/ipo/applications");
};

export const withdrawIPOApplication = (applicationId) => {
  return api.post("/ipo/withdraw", { applicationId });
};
