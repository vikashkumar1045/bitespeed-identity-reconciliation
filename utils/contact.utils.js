const Contact = require('../models/contact');

const findAllRelatedContacts = async (email, phoneNumber) => {
  return await Contact.find({
    $or: [
      { email: email || null },
      { phoneNumber: phoneNumber || null },
    ],
  });
};

module.exports = { findAllRelatedContacts };
