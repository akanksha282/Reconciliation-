const Contact = require("../model/model.js");

module.exports = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Provide email or phoneNumber" });
    }

    const contacts = await Contact.find({
      $or: [{ email }, { phoneNumber }]
    });

    if (contacts.length === 0) {
      const newContact = await Contact.create({ email, phoneNumber, linkPrecedence: "primary" });
      return res.status(200).json({
        contact: {
          primaryContatctId: newContact._id,
          emails: [email],
          phoneNumbers: [phoneNumber],
          secondaryContactIds: []
          
        }
      });
    }

    const all = await Contact.find({
      $or: [
        { email: { $in: contacts.map(c => c.email).filter(Boolean) } },
        { phoneNumber: { $in: contacts.map(c => c.phoneNumber).filter(Boolean) } }
      ]
    });

    const primaries = all.filter(c => c.linkPrecedence === "primary");
    const primary = primaries.reduce((oldest, curr) =>
      new Date(curr.createdAt) < new Date(oldest.createdAt) ? curr : oldest
    );

 
    const toUpdate = all.filter(c => c._id.toString() !== primary._id.toString());

    for (let c of toUpdate) {
      if (c.linkPrecedence === "primary") {
        c.linkPrecedence = "secondary";
        c.linkedId = primary._id;
        await c.save();
      }
    }

    const exists = all.some(c => c.email === email && c.phoneNumber === phoneNumber);
    if (!exists && (email || phoneNumber)) {
      await Contact.create({ email, phoneNumber, linkPrecedence: "secondary", linkedId: primary._id });
    }

    const final = await Contact.find({
      $or: [
        { _id: primary._id },
        { linkedId: primary._id }
      ]
    });

    const emails = [...new Set(final.map(c => c.email).filter(Boolean))];
    const phones = [...new Set(final.map(c => c.phoneNumber).filter(Boolean))];
    const secondaryIds = final.filter(c => c.linkPrecedence === "secondary").map(c => c._id);

    res.status(200).json({
      contact: {
        primaryContatctId: primary._id,
        emails,
        phoneNumbers: phones,
        secondaryContactIds: secondaryIds
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
