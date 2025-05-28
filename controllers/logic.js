const Contact = require('../models/contact');
const { findAllRelatedContacts } = require('../utils/contact.utils');

const identifyContact = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'At least email or phoneNumber is required' });
  }

  // Find all related contacts with matching email or phoneNumber
  let relatedContacts = await findAllRelatedContacts(email, phoneNumber);

  if (relatedContacts.length === 0) {
    // No related contacts found, create a new primary contact
    const newContact = await Contact.create({ email, phoneNumber });
    return res.json({
      contact: {
        primaryContactId: newContact._id,
        emails: [newContact.email].filter(Boolean),
        phoneNumbers: [newContact.phoneNumber].filter(Boolean),
        secondaryContactIds: [],
      },
    });
  }

  // Find primary contact(s) among related contacts
  const primaryContacts = relatedContacts.filter(c => c.linkPrecedence === 'primary');
  const primary = primaryContacts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

  // Get all contacts linked to the primary contact
  const allLinkedContacts = await Contact.find({
    $or: [
      { _id: primary._id },
      { linkedId: primary._id },
    ],
  });

  // Collect emails, phoneNumbers, and secondary contact ids
  const emails = new Set();
  const phoneNumbers = new Set();
  const secondaryIds = [];

  for (const contact of allLinkedContacts) {
    if (contact.email) emails.add(contact.email);
    if (contact.phoneNumber) phoneNumbers.add(contact.phoneNumber);
    if (contact._id.toString() !== primary._id.toString()) {
      secondaryIds.push(contact._id);
    }
  }

  // Check if the incoming contact info already exists in the linked contacts
  const isAlreadyPresent = allLinkedContacts.some(
    c => c.email === email && c.phoneNumber === phoneNumber
  );

  // If new info is present, create a secondary contact linked to primary
  if (!isAlreadyPresent) {
    const newContact = await Contact.create({
      email,
      phoneNumber,
      linkedId: primary._id,
      linkPrecedence: 'secondary',
    });
    secondaryIds.push(newContact._id);
    if (newContact.email) emails.add(newContact.email);
    if (newContact.phoneNumber) phoneNumbers.add(newContact.phoneNumber);
  }

  res.json({
    contact: {
      primaryContactId: primary._id,
      emails: [primary.email, ...[...emails].filter(e => e !== primary.email)],
      phoneNumbers: [primary.phoneNumber, ...[...phoneNumbers].filter(p => p !== primary.phoneNumber)],
      secondaryContactIds: secondaryIds,
    },
  });
};

module.exports = { identifyContact };
