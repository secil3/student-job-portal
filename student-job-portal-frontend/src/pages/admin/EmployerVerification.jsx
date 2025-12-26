import { useEffect, useState } from "react";
import api from "../../services/api";

export default function EmployerVerification() {
  const [employers, setEmployers] = useState([]);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    const res = await api.get("/admin/employers");
    setEmployers(res.data);
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/employers/${id}`, { status });
    fetchEmployers();
  };

  return (
    <div>
      <h2>Pending Employers</h2>

      {employers.length === 0 && <p>No pending employers.</p>}

      {employers.map((emp) => (
        <div key={emp.id} style={{ border: "1px solid #ccc", margin: "10px" }}>
          <p><b>Email:</b> {emp.email}</p>

          <button onClick={() => updateStatus(emp.id, "approved")}>
            Approve
          </button>

          <button
            onClick={() => updateStatus(emp.id, "rejected")}
            style={{ marginLeft: "10px" }}
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}
