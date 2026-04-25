document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsHeading = document.createElement("p");
        participantsHeading.className = "participants-heading";
        participantsHeading.innerHTML = "<strong>Participants:</strong>";
        activityCard.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (details.participants.length === 0) {
          const emptyState = document.createElement("li");
          emptyState.className = "participant-empty";
          emptyState.textContent = "No participants yet";
          participantsList.appendChild(emptyState);
        } else {
          details.participants.forEach((participantEmail) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmailText = document.createElement("span");
            participantEmailText.textContent = participantEmail;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-participant-button";
            deleteButton.dataset.activityName = name;
            deleteButton.dataset.email = participantEmail;
            deleteButton.setAttribute("aria-label", `Remove ${participantEmail} from ${name}`);
            deleteButton.innerHTML = "&times;";

            participantItem.appendChild(participantEmailText);
            participantItem.appendChild(deleteButton);
            participantsList.appendChild(participantItem);
          });
        }

        activityCard.appendChild(participantsList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        await fetchActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-participant-button");

    if (!deleteButton) {
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(deleteButton.dataset.activityName)}/signup?email=${encodeURIComponent(deleteButton.dataset.email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        await fetchActivities();
        showMessage(result.message, "success");
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
