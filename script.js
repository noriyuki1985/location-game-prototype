let score = 0;
document.getElementById("click-btn").addEventListener("click", () => {
  score++;
  document.getElementById("score").textContent = score;
});
