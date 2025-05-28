// ✅ todo.js — כולל תיקון לשליחת המספר האמיתי של שורת הגיליון

document.addEventListener("DOMContentLoaded", async () => {
  const username = sessionStorage.getItem("user");
  if (!username) return (window.location.href = "/");

  document.getElementById("welcome").innerText = `שלום, ${username}`;
  document.getElementById("logout").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "/";
  });

  const tableBody = document.querySelector("#task-table tbody");

  try {
    const res = await fetch(`/history?user=${encodeURIComponent(username)}`);
    const data = await res.json();

    data.forEach((item) => {
      const row = item.row;
      const rowIndex = item.rowIndex; // ← מספר שורה בגיליון

      const tr = document.createElement("tr");

      const userCell = document.createElement("td");
      userCell.textContent = row[0] || "";
      tr.appendChild(userCell);

      const idCell = document.createElement("td");
      idCell.textContent = row[1] || "";
      tr.appendChild(idCell);

      const descCell = document.createElement("td");
      descCell.textContent = row[2] || "";
      tr.appendChild(descCell);

      const taskCell = document.createElement("td");
      taskCell.textContent = row[3] || "";
      tr.appendChild(taskCell);

      const qtyCell = document.createElement("td");
      qtyCell.textContent = row[4] || "";
      tr.appendChild(qtyCell);

      // התחיל
      const startCell = document.createElement("td");
      const startCheckbox = document.createElement("input");
      startCheckbox.type = "checkbox";
      startCheckbox.disabled = row[5] === "TRUE" || row[5] === true;
      startCheckbox.addEventListener("change", async () => {
        if (!startCheckbox.checked) return;
        const now = new Date().toLocaleString("he-IL");
        await fetch(`/tasks/${rowIndex}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: now,
            done: row[6] === "TRUE",
            status: "התחיל"
          })
        });
        startCheckbox.disabled = true;
      });
      startCell.appendChild(startCheckbox);
      tr.appendChild(startCell);

      // בוצע
      const doneCell = document.createElement("td");
      const doneCheckbox = document.createElement("input");
      doneCheckbox.type = "checkbox";
      doneCheckbox.disabled = row[6] === "TRUE" || row[6] === true;
      doneCheckbox.addEventListener("change", async () => {
        if (!doneCheckbox.checked) return;
        const now = new Date().toLocaleString("he-IL");
        await fetch(`/tasks/${rowIndex}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endTime: now,
            done: true,
            status: "בוצע"
          })
        });
        doneCheckbox.disabled = true;
      });
      doneCell.appendChild(doneCheckbox);
      tr.appendChild(doneCell);

      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error("שגיאה בטעינת משימות:", err);
  }
});
