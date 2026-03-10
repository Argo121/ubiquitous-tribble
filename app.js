document.addEventListener("DOMContentLoaded", function() {
  const CODE_WORD = "300"; // кодовое слово для превышения лимита
  const MOVE_BUTTON_CODE = "Нет чекам"; // чит-код для перемещения кнопки

  // Утилиты
  function findValueCellByKey(startText) {
    const rows = Array.from(document.querySelectorAll('.details .row')) || [];
    for (const row of rows) {
      const keyEl = row.querySelector('.key');
      const valEl = row.querySelector('.value');
      if (!keyEl || !valEl) continue;
      if (keyEl.textContent.trim().startsWith(startText)) return valEl;
    }
    return null;
  }

  function saveToStorage(data) {
    try { localStorage.setItem('paymentData', JSON.stringify(data)); } catch (e) { console.warn(e); }
  }

  function loadFromStorage() {
    try { return JSON.parse(localStorage.getItem('paymentData') || 'null'); } catch (e) { return null; }
  }

  // Если на странице есть `.input-form`, работаем в режиме ввода (entry page)
  const inputForm = document.querySelector('.input-form');
  // Убедимся, что страница может скроллиться — нужно для скрытия адресной строки на мобильных
  function ensureScrollable() {
    try {
      const spacerId = 'scroll-spacer';
      let spacer = document.getElementById(spacerId);
      const bodyHeight = document.body.scrollHeight;
      const winH = window.innerHeight;
      // Делаем запас, чтобы гарантировать вертикальный скролл
      // Если тело меньше окна, создаём spacer не менее 160px
      const baseNeeded = winH - bodyHeight;
      const needed = baseNeeded > 0 ? Math.max(160, baseNeeded + 120) : 0;
      if (needed > 0) {
        if (!spacer) {
          spacer = document.createElement('div');
          spacer.id = spacerId;
          spacer.style.width = '1px';
          spacer.style.background = 'transparent';
          spacer.style.pointerEvents = 'none';
          document.body.appendChild(spacer);
        }
        spacer.style.height = Math.ceil(needed) + 'px';
      } else if (spacer) {
        spacer.remove();
      }
    } catch (e) { /* ignore */ }
  }

  window.addEventListener('resize', ensureScrollable);
  window.addEventListener('orientationchange', function(){ setTimeout(ensureScrollable, 300); });
  window.addEventListener('load', function(){ setTimeout(ensureScrollable, 300); });
  // Попробуем сделать небольшую программную прокрутку, чтобы мобильные браузеры скрыли адресную строку.
  // Это не всегда сработает (браузеры блокируют автоскролл), но даёт шанс.
  window.addEventListener('load', function() { setTimeout(function(){ try{ window.scrollTo(0, 1); } catch(e){} }, 600); });
  if (inputForm) {
    const submitButton = document.getElementById('submit');
    const priceInput = document.getElementById('price');
    const priceError = document.getElementById('price-error');
    const codeWordInput = document.getElementById('code-word');

    // Ограничение для поля price
    priceInput.addEventListener('input', function() {
      const priceValue = Number(priceInput.value) || 0;
      if (priceValue > 300 && codeWordInput.value.trim() !== CODE_WORD) {
        priceError.style.display = 'block';
        priceInput.value = 300;
      } else {
        priceError.style.display = 'none';
      }
    });

    // Чит-код для перемещения кнопки
    codeWordInput.addEventListener('input', function() {
      if (codeWordInput.value.trim() === MOVE_BUTTON_CODE) {
        submitButton.style.position = 'absolute';
        submitButton.style.transition = 'all 0.3s ease';
      } else {
        submitButton.style.position = '';
      }
    });

    submitButton.addEventListener('mouseover', function() {
      if (codeWordInput.value.trim() === MOVE_BUTTON_CODE) {
        const randomX = Math.floor(Math.random() * (window.innerWidth - submitButton.offsetWidth - 24));
        const randomY = Math.floor(Math.random() * (window.innerHeight - submitButton.offsetHeight - 24));
        submitButton.style.left = `${randomX}px`;
        submitButton.style.top = `${randomY}px`;
      }
    });

    submitButton.addEventListener('click', function() {
      const nameInput = document.getElementById('name').value.trim();
      const numberInput = document.getElementById('number').value.trim();
      const priceValue = Number(priceInput.value);

      if (!nameInput || !numberInput || !priceValue) {
        alert('Пожалуйста, заполните все поля!');
        return;
      }

      if (!/^\d+$/.test(numberInput)) {
        alert('Номер телефона должен содержать только цифры!');
        return;
      }

      if (priceValue <= 0) {
        alert('Введите корректную сумму!');
        return;
      }

      if (priceValue > 300 && codeWordInput.value.trim() !== CODE_WORD) {
        alert('Для ввода суммы больше 300 введите корректное кодовое слово!');
        return;
      }

      const data = {
        name: nameInput,
        number: numberInput,
        price: priceValue,
        ts: Date.now()
      };

      saveToStorage(data);
      // Перенаправляем на страницу просмотра
      window.location.href = 'index.html';
    });

    return; // режим ввода завершён
  }

  // Если формы нет — работаем в режиме отображения (index.html)
  const stored = loadFromStorage();
  if (!stored) {
    // Если данных нет — показываем страницу ввода
    window.location.href = 'entry.html';
    return;
  }

  // Форматируем сумму и дату
  const priceValue = Number(stored.price) || 0;
  const formattedPrice = priceValue.toFixed(2).replace('.', ',');
  const now = new Date(stored.ts || Date.now());
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const formattedDate = `${day}.${month}.${year}, ${hours}:${minutes}`;

  // Обновляем сумму, сохраняя <span class="currency">
  const amountElement = document.querySelector('.amount');
  if (amountElement) {
    amountElement.innerHTML = `-${formattedPrice} <span class="currency">C</span>`;
  }

  const dateCell = findValueCellByKey('Дата');
  if (dateCell) dateCell.textContent = formattedDate;

  const receiptCell = findValueCellByKey('Номер квитанции');
  if (receiptCell) receiptCell.textContent = 'P' + (stored.ts || Date.now()).toString().slice(-12);

  const recipientCell = findValueCellByKey('Получатель');
  if (recipientCell) recipientCell.textContent = stored.name || '';

  const totalCell = findValueCellByKey('Итого');
  if (totalCell) totalCell.textContent = `${formattedPrice} с`;

  const purposeCell = findValueCellByKey('Назначение');
  if (purposeCell) {
    const fullPhone = '996' + (stored.number || '');
    purposeCell.innerHTML = `Перевод по номеру<br>телефона<br>${fullPhone} / ${stored.name || ''}//<br>Сумма ${formattedPrice} KGS`;
  }

  // Очистим запись, чтобы повторный заход не перезаполнял без нового ввода
  try { localStorage.removeItem('paymentData'); } catch (e) {}
  // Гарантируем возможность скроллинга (чтобы адресная строка скрывалась на мобилах при прокрутке)
  setTimeout(ensureScrollable, 200);
});
