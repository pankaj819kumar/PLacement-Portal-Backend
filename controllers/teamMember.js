const TeamMembers = require("../models/teamMembers");
const Student = require("../models/students");
const mongoose = require("mongoose");
const User = require("../models/users");
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
    console.log(id);
    var uId;
    Student.findOne({ _id: id }, (err, result) => {
      if (err) {
        console.log(err);
        return;
      }
    uId=result.userId;
    })

    const updatedTeamMember = await Student.updateOne(
      {  _id: id },
      {designation:req.body.designation}
    );
    if(req.body.designation==="STUDENT")
    {
      User.updateOne({ _id: uId }, { $set: { roles: ["STUDENT"] } }, (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
      
        console.log(result);
      });
    }
    if(!(req.body.designation==="STUDENT"))
    {
      User.updateOne({ _id: uId }, {  $push: { roles: "PLACEMENT_TEAM" }  }, (err, result) => {
        if (err) {
          console.log(err);
          return;
        }
      
        console.log(result);
      });
    }
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
function sortDesignation(array) {
  const designationPriority = {
    'OVERALL CO-ORDINATOR': 0,
    "MTECH CO-ORDINATOR": 1,
    "BTECH CO-ORDINATOR": 2,
    " PLACEMENT EXECUTIVE": 3
  };

  array.sort((a, b) => {
    const aPriority = designationPriority[a.designation];
    const bPriority = designationPriority[b.designation];
    return aPriority - bPriority;
  });

  return array;
}
exports.viewTeam=async (req, res) =>{
  try {
    const teamMembers = await Student.find({ designation: { $ne: 'STUDENT',$exists: true } },"name designation phoneNo altPhoneNo department collegeEmail personalEmail")
    .then(users => {console.log("yes",users)
  const temp= sortDesignation(users)
  res.json(temp)})
    .catch(err => console.log(err));
    console.log("no",teamMembers)
  
  } catch (error) {
    console.log("Error occurred in /viewTeam", error);
    res.status(500).json({ error: "Some error occurred" });
  }
}