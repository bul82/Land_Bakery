/* ==========================================
   BAKERY LANDING INTERACTION LOGIC (script.js)
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("bakeryForm");
    const weightRange = document.getElementById("weightRange");
    const weightVal = document.getElementById("weightVal");
    const servingsVal = document.getElementById("servingsVal");
    const fillingSelect = document.getElementById("fillingSelect");
    const totalPriceEl = document.getElementById("totalPrice");
    const baseRadios = document.querySelectorAll("input[name='base']");
    const decorCheckboxes = document.querySelectorAll("input[name='decor']");
    const submitBtn = form.querySelector(".submit-btn");

    // Initialize calculator
    calculatePrice();

    // Base Selection Handler
    baseRadios.forEach(radio => {
        radio.addEventListener("change", calculatePrice);
    });

    // Weight Slider Handler
    weightRange.addEventListener("input", (e) => {
        const weight = parseFloat(e.target.value);
        weightVal.textContent = weight.toFixed(1);
        
        // Calculate servings (approx 150g per serving)
        const servings = Math.round(weight / 0.15);
        servingsVal.textContent = servings;
        
        calculatePrice();
    });

    // Filling Selection Handler
    fillingSelect.addEventListener("change", calculatePrice);

    // Decor Selection Handler
    decorCheckboxes.forEach(cb => {
        cb.addEventListener("change", calculatePrice);
    });

    // Calculate Price Logic
    function calculatePrice() {
        let basePricePerKg = 2200;
        baseRadios.forEach(radio => {
            if (radio.checked) {
                basePricePerKg = parseInt(radio.getAttribute("data-price") || 2200);
            }
        });

        // Get filling extra price per kg
        const selectedFilling = fillingSelect.options[fillingSelect.selectedIndex];
        const fillingExtraPerKg = parseInt(selectedFilling.getAttribute("data-extra") || 0);

        // Get weight
        const weight = parseFloat(weightRange.value);

        // Sum decor price
        let decorSum = 0;
        decorCheckboxes.forEach(cb => {
            if (cb.checked) {
                decorSum += parseInt(cb.getAttribute("data-price") || 0);
            }
        });

        // Calculate total
        const total = Math.round((basePricePerKg + fillingExtraPerKg) * weight) + decorSum;

        // Format and display
        totalPriceEl.textContent = total.toLocaleString("ru-RU");
    }

    // Form Submission Handler
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = form.name.value.trim();
        const contact = form.contact.value.trim();
        const delivery = form.delivery.value.trim();
        const wishes = form.wishes.value.trim() || "Нет";

        // Get base text
        let baseText = "Бисквитная";
        baseRadios.forEach(radio => {
            if (radio.checked) {
                baseText = radio.closest(".select-card").querySelector(".card-name").textContent.trim();
            }
        });

        // Get filling text
        const fillingText = fillingSelect.options[fillingSelect.selectedIndex].text;

        // Get weight & servings
        const weight = weightRange.value;
        const servings = servingsVal.textContent;
        const price = totalPriceEl.textContent;

        // Collect decor
        const decorList = [];
        decorCheckboxes.forEach(cb => {
            if (cb.checked) {
                const decorName = cb.closest(".decor-item").querySelector(".decor-name").textContent.trim();
                decorList.push(decorName);
            }
        });
        const decorStr = decorList.length > 0 ? decorList.join(", ") : "Без декора";

        const message = 
            `Заказ торта:\n` +
            `- Основа: ${baseText}\n` +
            `- Начинка: ${fillingText}\n` +
            `- Декор: ${decorStr}\n` +
            `- Вес: ${weight} кг (${servings} порций)\n` +
            `- Дата получения: ${delivery}\n` +
            `- Пожелания: ${wishes}\n` +
            `- Расчетная стоимость: ${price} ₽`;

        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка заказа...";

        fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                contact: contact,
                message: message,
                source: "bakery"
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("Server error");
            return res.json();
        })
        .then(data => {
            alert(`Спасибо за заказ, ${name}! Мы свяжемся с вами в ближайшее время для подтверждения деталей и оформления предоплаты.`);
            form.reset();
            // Reset state
            baseRadios[0].checked = true;
            weightRange.value = "2.0";
            weightVal.textContent = "2.0";
            servingsVal.textContent = "13";
            calculatePrice();
        })
        .catch(err => {
            console.error(err);
            alert("Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз или напишите нам напрямую.");
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        });
    });
});
