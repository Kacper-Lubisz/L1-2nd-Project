document.addEventListener("DOMContentLoaded", function () {

    if (typeof (Storage) === "undefined") {
        $("#content").load("/errorView.html");
    } else {
        const existingData = localStorage.getItem("authenticationToken");

        if (existingData === null) {
            $("#content").load("/login.html");
        } else if (existingData.message !== undefined && existingData.signature !== undefined) {
            if (existingData.message.validUntil > new Date().getTime()) {
                // TODO load some real content

            } else {
                $("#content").load("/login.html");
                $("#message").html("Your login has expired");
            }
        }
    }
});

