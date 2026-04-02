export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Verify API secret key
  const callerKey = req.headers["x-api-key"];
  if (!callerKey || callerKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ message: "Unauthorized: invalid x-api-key" });
  }

  // Get GHL API credentials from headers
  const ghlApiKey = req.headers["x-ghl-api-key"];
  if (!ghlApiKey) {
    return res.status(401).json({ message: "Missing x-ghl-api-key header" });
  }

  const locationId = req.headers["x-location-id"];
  if (!locationId) {
    return res.status(400).json({ message: "Missing x-location-id header" });
  }

  try {
    // Fetch all contacts from GHL API
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-07-28"
        }
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("GHL API error:", response.status, errorBody);
      return res.status(502).json({ message: "Failed to fetch contacts from GHL" });
    }

    const data = await response.json();
    const contacts = data.contacts || [];

    // Check for duplicate emails and phone numbers
    const duplicates = checkDuplicates(contacts);

    return res.status(200).json({
      totalContacts: contacts.length,
      contacts: contacts,
      duplicates: duplicates
    });

  } catch (err) {
    console.error("Network error calling GHL API:", err);
    return res.status(502).json({ message: "Network error while contacting GHL API" });
  }
}

/**
 * Check for duplicate emails and phone numbers in contacts
 * @param {Array} contacts - Array of contact objects
 * @returns {Object} Object containing duplicate information
 */
function checkDuplicates(contacts) {
  const emailMap = {};
  const phoneMap = {};
  const duplicateEmails = [];
  const duplicatePhones = [];

  contacts.forEach((contact) => {
    // Check email duplicates
    if (contact.email) {
      const email = contact.email.toLowerCase();
      if (emailMap[email]) {
        emailMap[email].push(contact.id);
      } else {
        emailMap[email] = [contact.id];
      }
    }

    // Check phone duplicates
    if (contact.phone) {
      const phone = contact.phone;
      if (phoneMap[phone]) {
        phoneMap[phone].push(contact.id);
      } else {
        phoneMap[phone] = [contact.id];
      }
    }
  });

  // Find duplicates (where count > 1)
  Object.entries(emailMap).forEach(([email, ids]) => {
    if (ids.length > 1) {
      duplicateEmails.push({
        email: email,
        contactIds: ids,
        count: ids.length
      });
    }
  });

  Object.entries(phoneMap).forEach(([phone, ids]) => {
    if (ids.length > 1) {
      duplicatePhones.push({
        phone: phone,
        contactIds: ids,
        count: ids.length
      });
    }
  });

  return {
    uniqueEmails: Object.values(emailMap).filter(ids => ids.length === 1).length,
    duplicateEmailCount: duplicateEmails.length,
    duplicateEmails: duplicateEmails,
    uniquePhones: Object.values(phoneMap).filter(ids => ids.length === 1).length,
    duplicatePhoneCount: duplicatePhones.length,
    duplicatePhones: duplicatePhones,
    nullEmails: contacts.filter(c => !c.email).length,
    nullPhones: contacts.filter(c => !c.phone).length
  };
}
