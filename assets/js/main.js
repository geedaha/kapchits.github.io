/* Показ случайной пословицы на главной странице.
 *
 * Данные (константа PROVERBS) Hugo генерирует из site/data/proverbs.json и
 * подключает перед этим файлом. Правится файл данных, не этот и не тот.
 */
(function () {
  if (typeof PROVERBS === "undefined" || !PROVERBS.length) return;

  var slot = document.getElementById("proverb-somali");
  if (!slot) return;                     // на этой странице блока нет

  var p = PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
  var put = function (id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    // Русская строка есть не у всех: пустую прячем, а не показываем кавычки ни с чем
    if (!text) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = '“' + text + '”';
  };
  put("proverb-somali", p.somali);
  put("proverb-english", p.english);
  put("proverb-russian", p.russian);
})();
