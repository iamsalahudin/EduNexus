export async function sendToApi({ conversationId, message }) {
  // Replace later with real NLP backend
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        reply: "Attendance report for Class A (March)",
        data: {
          type: "table",
          columns: ["Student", "Present", "Absent"],
          rows: [
            ["Ali", 22, 3],
            ["Sara", 24, 1]
          ]
        },
        chart: {
          type: "bar",
          labels: ["Ali", "Sara"],
          values: [22, 24]
        },
        actions: [
          {
            type: "download",
            label: "Download CSV",
            url: "/sample-attendance.csv"
          },
          {
            type: "navigate",
            label: "Go to Attendance Page",
            path: "/attendance"
          }
        ]
      });
    }, 900);
  });
}
