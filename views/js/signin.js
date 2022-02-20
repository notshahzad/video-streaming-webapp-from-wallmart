async function signin() {
  username = document.getElementById("name").value;
  password = document.getElementById("password").value;
  console.log(username, password);
  const result = await fetch("/signin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: username,
      password: password,
    }),
  });
  res = await result.json();
  console.log(res);
  if (res.success == true && res.ref_token) {
    localStorage.setItem("ref_token", res.ref_token);
  }
}
