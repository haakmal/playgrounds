(function () {
  document.querySelectorAll(".factor-card").forEach(function (card) {
    var select = card.querySelector("select"),
      description = document.createElement("p");
    description.className = "factor-description";
    description.style.cssText = "margin:14px 0 0;color:#726c63;font-size:12px;line-height:1.35;max-width:22ch";
    select.insertAdjacentElement("beforebegin", description);
    function update() {
      var option = select.options[select.selectedIndex];
      description.textContent =
        option && option.dataset.description ? option.dataset.description : "A student-defined condition for this design.";
    }
    select.addEventListener("change", update);
    update();
  });
})();
