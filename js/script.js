$(document).ready(function () {
    console.log("jQuery is ready!");

    initTheme();
    initNavigation();
    initHome();
    initReadMore();
    initRatings();
    initSearch();
    initRecipes();
    initRestaurants();
    initForms();
    initScroll();
});

// Task 7: notifications

function notifyUser(text) {
    $("#notification")
        .stop(true, true)
        .text(text)
        .fadeIn(150)
        .delay(2500)
        .fadeOut(300);
}

// Sound

let audioContext;
let currentTone;

function playSound() {
    try {
        audioContext = audioContext || new AudioContext();
        audioContext.resume();

        if (currentTone) {
            currentTone.stop();
        }

        const tone = audioContext.createOscillator();
        const volume = audioContext.createGain();

        tone.connect(volume);
        volume.connect(audioContext.destination);

        tone.frequency.value = 700;

        volume.gain.setValueAtTime(
            0.08,
            audioContext.currentTime
        );

        volume.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.1
        );

        tone.start();
        tone.stop(audioContext.currentTime + 0.1);

        currentTone = tone;

        tone.onended = function () {
            tone.disconnect();
            volume.disconnect();

            if (currentTone === tone) {
                currentTone = null;
            }
        };
    } catch (error) {
        console.log("Sound is unavailable.");
    }
}

// Day and night theme

function initTheme() {
    try {
        document.body.classList.toggle(
            "night",
            localStorage.getItem("theme") === "night"
        );
    } catch (error) {}

    function updateLabel() {
        $("#themeBtn").text(
            $("body").hasClass("night") ? "Day mode" : "Night mode"
        );
    }

    updateLabel();

    $("#themeBtn").on("click", function () {
        $("body").toggleClass("night");
        document.body.style.backgroundColor = "";

        updateLabel();

        try {
            localStorage.setItem(
                "theme",
                $("body").hasClass("night") ? "night" : "day"
            );
        } catch (error) {}
    });
}

// Keyboard navigation and switch statement

function initNavigation() {
    const links = document.querySelectorAll(".navbar-nav .nav-link");

    links.forEach(function (link, index) {
        link.addEventListener("keydown", function (event) {
            let next;

            switch (event.key) {
                case "ArrowRight":
                case "ArrowDown":
                    next = (index + 1) % links.length;
                    break;

                case "ArrowLeft":
                case "ArrowUp":
                    next = (index - 1 + links.length) % links.length;
                    break;

                case "Home":
                    next = 0;
                    break;

                case "End":
                    next = links.length - 1;
                    break;

                default:
                    return;
            }

            event.preventDefault();
            links[next].focus();
        });
    });
}

// Home: clock, background, FAQ and popup

function initHome() {
    if (!$("#datetime").length) return;

    function updateTime() {
        $("#datetime").text(new Date().toLocaleString("en-US"));
    }

    updateTime();
    setInterval(updateTime, 1000);

    let colorIndex = 0;

    $("#colorBtn").on("click", function () {
        const colors = $("body").hasClass("night")
            ? ["#15161a", "#292129", "#172a24"]
            : ["#fde8e0", "#e3f2e1", "#e0ecfb"];

        document.body.style.backgroundColor =
            colors[colorIndex++ % colors.length];
    });

    $(".faq-question").on("click", function () {
        const open = $(this).attr("aria-expanded") !== "true";

        $(this).attr("aria-expanded", String(open));
        $(this).next().stop(true, true).slideToggle(200);
    });

    function closePopup() {
        $("#popupOverlay").removeClass("show");
        $("body").css("overflow", "");
        $("#openPopup").trigger("focus");
    }

    $("#openPopup").on("click", function () {
        $("#popupOverlay").addClass("show");
        $("body").css("overflow", "hidden");
        $("#subEmail").trigger("focus");
    });

    $("#closePopup").on("click", closePopup);

    $("#popupOverlay").on("click", function (event) {
        if (event.target === this) {
            closePopup();
        }
    });

    $(document).on("keydown", function (event) {
        if (!$("#popupOverlay").hasClass("show")) return;

        if (event.key === "Escape") {
            closePopup();
        }

        if (event.key === "Tab") {
            const items = $("#popupOverlay")
                .find("button:enabled, input:enabled")
                .get();

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });
}

// Countries: Read more

function initReadMore() {
    $(".read-more-btn").on("click", function () {
        const extra = this.nextElementSibling;
        const open = getComputedStyle(extra).display === "none";

        extra.style.display = open ? "block" : "none";
        this.textContent = open ? "Read less" : "Read more";
        this.setAttribute("aria-expanded", String(open));
    });
}

// Dish ratings: DOM, loop, click event and animation

function initRatings() {
    document.querySelectorAll(".gallery-item").forEach(function (card) {
        const rating = document.createElement("div");
        rating.className = "rating";

        const label = document.createElement("span");
        label.className = "rating-value";
        label.textContent = "Rate it";

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("button");

            star.type = "button";
            star.className = "star";
            star.textContent = "★";
            star.dataset.value = i;

            star.setAttribute("aria-label", "Rate " + i + " out of 5");
            star.setAttribute("aria-pressed", "false");

            star.addEventListener("click", function () {
                rating.querySelectorAll(".star").forEach(function (item) {
                    item.classList.toggle(
                        "active",
                        Number(item.dataset.value) <= i
                    );

                    item.setAttribute(
                        "aria-pressed",
                        String(Number(item.dataset.value) === i)
                    );
                });

                label.textContent = i + "/5";

                card.classList.remove("pop");
                void card.offsetWidth;
                card.classList.add("pop");

                playSound();
                notifyUser("Your rating: " + i + "/5");
            });

            rating.appendChild(star);
        }

        rating.appendChild(label);
        card.appendChild(rating);
    });
}

// Tasks 1–3: live search, autocomplete and highlighting

function initSearch() {
    const $input = $("#dishSearch");
    const $cards = $(".gallery-item");

    if (!$input.length) return;

    const $suggestions = $("#searchSuggestions");

    const names = $cards.map(function () {
        return $(this).find("figcaption strong").text().trim();
    }).get();

    function closeSuggestions() {
        $suggestions.prop("hidden", true);
        $input.attr("aria-expanded", "false");
    }

    // Build text nodes so search input is never interpreted as HTML.

    function highlight(element, query) {
        const text = element.textContent;

        element.replaceChildren();

        let start = 0;
        let index = query ? text.toLowerCase().indexOf(query) : -1;

        while (index !== -1) {
            element.append(
                document.createTextNode(text.slice(start, index))
            );

            const mark = document.createElement("mark");
            mark.textContent = text.slice(index, index + query.length);
            element.append(mark);

            start = index + query.length;
            index = text.toLowerCase().indexOf(query, start);
        }

        element.append(document.createTextNode(text.slice(start)));
    }

    function search(showSuggestions) {
        const query = $input.val().trim().toLowerCase();
        let count = 0;

        $cards.each(function () {
            const match = $(this)
                .find("figcaption")
                .text()
                .toLowerCase()
                .includes(query);

            $(this).toggle(match);

            if (match) {
                count++;
            }

            $(this)
                .find("figcaption strong, figcaption span")
                .each(function () {
                    highlight(this, query);
                });
        });

        $("#searchCount").text(
            count
                ? "Showing " + count + " of " + $cards.length + " dishes"
                : "No dishes found."
        );

        $suggestions.empty();

        const matches = names.filter(function (name) {
            return query && name.toLowerCase().includes(query);
        });

        matches.forEach(function (name) {
            const $button = $('<button type="button">')
                .text(name)
                .on("click", function () {
                    $input.val(name);
                    search(false);
                    $input.trigger("focus");
                });

            $("<li>").append($button).appendTo($suggestions);
        });

        const open = Boolean(showSuggestions && matches.length);

        $suggestions.prop("hidden", !open);
        $input.attr("aria-expanded", String(open));

        $(window).trigger("scroll");
    }

    $input.on("input", function () {
        search(true);
    });

    $("#clearSearch").on("click", function () {
        $input.val("");
        search(false);
        $input.trigger("focus");
    });

    $(".search-panel").on("keydown", function (event) {
        const buttons = $suggestions.find("button").get();
        const index = buttons.indexOf(document.activeElement);

        if (event.key === "Escape") {
            closeSuggestions();
            $input.trigger("focus");
        }

        if (
            !$suggestions.prop("hidden") &&
            ["ArrowDown", "ArrowUp"].includes(event.key)
        ) {
            event.preventDefault();

            const next = event.key === "ArrowDown"
                ? index + 1
                : index - 1;

            buttons[(next + buttons.length) % buttons.length].focus();
        }
    });

    $(document).on("click", function (event) {
        if (!$(event.target).closest(".search-panel").length) {
            closeSuggestions();
        }
    });

    search(false);
}

// Recipes: categories and Task 8 clipboard

function initRecipes() {
   $(".filter-btn").on("click", function (event) {
    if (event.originalEvent) {
        playSound();
    }

    const category = this.dataset.filter;
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");

        let count = 0;

        $(".recipe-box").each(function () {
            const show =
                category === "all" ||
                this.dataset.category === category;

            $(this).toggle(show);

            if (show) {
                count++;
            }
        });

        $("#recipeCount").text(
            "Showing " + count + " of " +
            $(".recipe-box").length + " recipes"
        );

        $(window).trigger("scroll");
    });

    $('.filter-btn[data-filter="all"]').trigger("click");

    $(".copy-recipe").on("click", async function () {
        const $button = $(this);
        const $card = $button.closest(".recipe-box");

        const ingredients = $card.find("ul li").map(function () {
            return this.textContent.trim();
        }).get();

        const steps = $card.find("ol li").map(function (i) {
            return (i + 1) + ". " + this.textContent.trim();
        }).get();

        const text =
            $card.find("h2").text().trim() +
            "\n\nIngredients\n" +
            ingredients.join("\n") +
            "\n\nSteps\n" +
            steps.join("\n");

        try {
            await navigator.clipboard.writeText(text);

            $button
                .text("✓ Copied")
                .attr("title", "Copied to clipboard!");

            $card.find(".copy-feedback").text("Copied to clipboard!");
            notifyUser("Recipe copied to clipboard!");

            clearTimeout($button.data("timer"));

            $button.data("timer", setTimeout(function () {
                $button.text("Copy recipe").removeAttr("title");
                $card.find(".copy-feedback").text("");
            }, 2500));
        } catch (error) {
            $card.find(".copy-feedback").text(
                "Allow clipboard access. Use HTTPS or localhost."
            );
        }
    });
}

// Restaurant objects, methods and arrays

function initRestaurants() {
    const ratings = [4.7, 4.5, 4.3, 4.6, 4.4, 4.2];

    const restaurants = $(".restaurant-card").map(function (index) {
        return {
            element: this,
            rating: ratings[index],

            getStars: function () {
                const full = Math.round(this.rating);

                return "★".repeat(full) + "☆".repeat(5 - full);
            }
        };
    }).get();

    restaurants.forEach(function (restaurant) {
        $("<p>")
            .addClass("restaurant-rating")
            .text(restaurant.getStars() + " " + restaurant.rating)
            .appendTo($(restaurant.element).find(".card-body"));
    });
}

// Forms: validation, steps, reset and Task 6 spinner

function initForms() {
    const $contact = $("#contactForm");
    let step = 1;

    function showStep(number) {
        step = number;

        $contact.find(".form-step")
            .removeClass("active")
            .filter('[data-step="' + number + '"]')
            .addClass("active");

        $("#stepIndicator").text("Step " + number + " of 2");
    }

    function validateFields($fields) {
        let valid = true;

        $fields.each(function () {
            this.setCustomValidity("");

            if (
                this.required &&
                this.type !== "checkbox" &&
                !this.value.trim()
            ) {
                this.setCustomValidity("Please complete this field.");
            }

            if (
                this.type === "email" &&
                this.value &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)
            ) {
                this.setCustomValidity("Enter a valid email address.");
            }

            if (
                this.minLength > 0 &&
                this.value.trim().length < this.minLength
            ) {
                this.setCustomValidity(
                    "Enter at least " + this.minLength + " characters."
                );
            }

            if (
                this.id === "regConfirm" &&
                this.value !== $("#regPassword").val()
            ) {
                this.setCustomValidity("Passwords do not match.");
            }

            const correct = this.checkValidity();

            $(this).toggleClass("is-invalid", !correct);

            if (!correct) {
                valid = false;
            }
        });

        if (!valid) {
            $fields.filter(".is-invalid").first()[0].reportValidity();
        }

        return valid;
    }

    $("#nextBtn").on("click", function () {
        const $fields = $contact.find('[data-step="1"] input');

        if (validateFields($fields)) {
            showStep(2);
        }
    });

    $("#backBtn").on("click", function () {
        showStep(1);
    });

    $contact.on("keydown", function (event) {
        if (
            event.key === "Enter" &&
            step === 1 &&
            event.target.tagName === "INPUT"
        ) {
            event.preventDefault();
            $("#nextBtn").trigger("click");
        }
    });

    $("form input, form select, form textarea").on(
        "input change",
        function () {
            this.setCustomValidity("");
            $(this).removeClass("is-invalid");
            $(this.form).find(".form-success").text("");
        }
    );

    $("#contactForm, #registerForm, #subscribeForm")
        .on("reset", function () {
            $(this).find("input, select, textarea").each(function () {
                this.setCustomValidity("");
            });

            $(this).find(".is-invalid").removeClass("is-invalid");
            $(this).find(".form-success").text("");

            if (this.id === "contactForm") {
                showStep(1);
            }
        })
        .on("submit", function (event) {
            event.preventDefault();

            const form = this;
            const $form = $(this);

            if ($form.data("busy")) return;

            if (form.id === "contactForm" && step === 1) {
                $("#nextBtn").trigger("click");
                return;
            }

            if (!validateFields($form.find("input, select, textarea"))) {
                return;
            }

            $form.data("busy", true).attr("aria-busy", "true");

            const $button = $form.find('[type="submit"]');
            const label = $button.html();

            const $controls = $form
                .find("input, select, textarea, button")
                .filter(":enabled");

            $controls.prop("disabled", true);

            $button.html(
                '<span class="loading-spinner" aria-hidden="true"></span>' +
                " Please wait…"
            );

            setTimeout(function () {
                $controls.prop("disabled", false);
                $button.html(label);

                $form.data("busy", false).removeAttr("aria-busy");

                form.reset();

                const message =
                    "Demo completed successfully. " +
                    "No data was sent to a server.";

                $form.find(".form-success").text(message);
                notifyUser(message);
            }, 1200);
        });
}

// Tasks 4, 5 and 9: progress, counters and lazy loading

function initScroll() {
    function inView(element) {
        const rect = element.getBoundingClientRect();

        return (
            $(element).is(":visible") &&
            rect.top < innerHeight &&
            rect.bottom > 0
        );
    }

    function update() {
        const max =
            document.documentElement.scrollHeight - innerHeight;

        const progress = max > 0
            ? Math.min(100, Math.max(0, scrollY / max * 100))
            : 100;

        $("#scrollProgress")
            .css("width", progress + "%")
            .attr("aria-valuenow", Math.round(progress));

        $("img[data-src]").each(function () {
            if (inView(this)) {
                $(this)
                    .attr("src", $(this).attr("data-src"))
                    .removeAttr("data-src");
            }
        });

        $(".counter").each(function () {
            const $counter = $(this);

            if (!inView(this) || $counter.data("started")) {
                return;
            }

            $counter.data("started", true);

            $({ value: 0 }).animate(
                { value: Number($counter.attr("data-target")) },
                {
                    duration: 1400,

                    step: function (value) {
                        $counter.text(Math.floor(value));
                    },

                    complete: function () {
                        $counter.text($counter.attr("data-target"));
                    }
                }
            );
        });
    }

    function showPlaceholder() {
        if (!this.src.endsWith("/images/placeholder.svg")) {
            this.src = "images/placeholder.svg";
        }
    }

    $(window).on("scroll resize load", update);

    $("img")
        .on("load", update)
        .on("error", showPlaceholder)
        .each(function () {
            if (this.complete && this.naturalWidth === 0) {
                showPlaceholder.call(this);
            }
        });

    update();
}