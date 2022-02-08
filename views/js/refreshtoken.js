function refresh() {
  console.log("calling");
  ref_token = localStorage.getItem("ref_token");
  fetch("/token", {
    method: "post",
    headers: { "content-Type": "application/json" },
    body: JSON.stringify({ ref_token }),
  })
    .then((res) => res.json())
    .then((res) => {
      try {
        CreateSocketConnection(res.token);
      } catch {}
    });
  setTimeout(refresh, 15 * 60000);
}
refresh();
