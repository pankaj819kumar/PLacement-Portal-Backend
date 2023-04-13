const TeamMembers = require("../models/teamMembers");
const Student = require("../models/students");
const mongoose = require("mongoose");
exports.getTeamMemberList = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const entriesPerPage = Number(req.query.entriesPerPage) || 10;

    let findObj = {};
    if (req.query.year) {
      findObj.year = req.query.year;
    }

    const teamMemberCount = await TeamMembers.countDocuments(findObj);
    const teamMemberList = await TeamMembers.find(findObj)
      .sort({ year: -1, level: 1, _id: 1 })
      .skip((page - 1) * entriesPerPage)
      .limit(entriesPerPage)
      .exec();
    res.json({
      pageCount: Math.ceil(teamMemberCount / entriesPerPage),
      data: teamMemberList,
    });
  } catch (error) {
    console.log("Error occurred in /getTeamMemberList", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};

exports.getTeamMemberDetails = async (req, res) => {
  try {
    let findObj = {};
    if (req.query.teamMemberId) {
      findObj.teamMemberId = req.query.teamMemberId;
    } else if (req.query.studentId) {
      findObj.studentId = req.query.studentId;
    } else {
      findObj.studentId = req.auth.studentId;
    }
    const teamMember = await TeamMembers.findOne(findObj);
    if (!teamMember) {
      return res.status(404).json({ error: "Team member does not exist" });
    }
    res.json(teamMember);
  } catch (error) {
    console.log("Error occurred in /getTeamMemberDetails", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};

exports.addTeamMember = async (req, res) => {
  try {
    if (req.body.studentId) {
      const teamMember = await TeamMembers.findOne({
        studentId: req.body.studentId,
      });
      if (teamMember) {
        return res
          .status(400)
          .json({ error: "Student is already in placement team" });
      }
    }
    const newTeamMember = new TeamMembers(req.body);
    await newTeamMember.save();
    res.json(newTeamMember);
  } catch (error) {
    console.log("Error occurred in /addTeamMember", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};

// exports.updateTeamMember = async (req, res) => {
//   try {
//     const teamMemberId = req.body.teamMemberId;
//     const teamMember = await TeamMembers.findOne({ _id: teamMemberId });
//     if (!teamMember) {
//       return res.status(404).json({ error: "Team member does not exist" });
//     }
//     const updatedTeamMember = await TeamMembers.updateOne(
//       { _id: teamMemberId },
//       req.body
//     );
//     if (updatedTeamMember.modifiedCount == 0) {
//       return res.status(500).json({ error: "Failed to update team member" });
//     }
//     res.json({ msg: "Team member updated successfully" });
//   } catch (error) {
//     console.log("Error occurred in /updateTeamMember", error);
//     res.status(500).json({ error: "Some error occurred" });
//   }
// };
exports.updateTeamMember = async (req, res) => {
  try {
    const userId = req.body.userId;
    console.log(userId);
    const id = mongoose.Types.ObjectId(userId);
    const user = await Student.findOne({ _id:id });
    if (!user) {
     console.log("User not found")
      // return res.status(404).json({ error: "Team member does not exist" });
    }
    const updatedTeamMember = await Student.updateOne(
      {  _id: id },
      {designation:req.body.designation}
    );
    if (updatedTeamMember.modifiedCount == 0) {
      return res.status(500).json({ error: "Failed to update team member" });
    }
    res.json({ msg: "Team member updated successfully" });
  } catch (error) {
    console.log("Error occurred in /updateTeamMember", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const teamMemberId = req.body.teamMemberId;
    const teamMember = await TeamMembers.findOne({ _id: teamMemberId });
    if (!teamMember) {
      return res.status(404).json({ error: "Team member does not exist" });
    }
    const deletedTeamMember = await TeamMembers.deleteOne({
      _id: teamMemberId,
    });
    if (deletedTeamMember.deletedCount == 0) {
      return res.status(500).json({ error: "Failed to delete team member" });
    }
    res.json({ msg: "Team member deleted successfully" });
  } catch (error) {
    console.log("Error occurred in /deleteTeamMember", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};
exports.viewTeam=async (req, res) =>{
  try {
    const teamMembers = await Student.find({ designation: { $ne: 'STUDENT',$exists: true } },"name designation phoneNo altPhoneNo department collegeEmail personalEmail")
    .then(users => {console.log("yes",users)
  
  res.json(users)})
    .catch(err => console.log(err));
    console.log("no",teamMembers)
  
  } catch (error) {
    console.log("Error occurred in /viewTeam", error);
    res.status(500).json({ error: "Some error occurred" });
  }
}