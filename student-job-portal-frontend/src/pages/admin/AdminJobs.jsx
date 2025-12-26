import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    const res = await api.get("/jobs");
    setJobs(res.data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const deleteJob = async (id) => {
    await api.delete(`/jobs/${id}`);
    fetchJobs();
  };

  return (
    <div>
      <h2>All Job Postings</h2>

      {jobs.map((job) => (
        <div key={job.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h4>{job.title}</h4>
          <p>{job.location}</p>
          <button onClick={() => deleteJob(job.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
