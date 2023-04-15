const mongoose = require("mongoose");

const Users = require("../models/users");
const Students = require("../models/students");
const Courses = require("../models/courses");
const Departments = require("../models/departments");
const HighSchoolGrades = require("../models/highSchoolGrades");
const IntermediateGrades = require("../models/intermediateGrades");
const GraduationGrades = require("../models/graduationGrades");
const CGPAGrades = require("../models/cgpaGrades");
const Addresses = require("../models/addresses");
const CourseCredits = require("../models/courseCredits");
const Student = require("../models/students");

exports.studentRegister = async (req, res) => {
  try {
    const user = await Users.findOne({ _id: req.auth._id }).select({
      email: 1,
    });
    const student = await Students.findOne({ userId: req.auth._id });
    if (student) {
      return res.status(400).json({ msg: "Student already registered" });
    }
    let studentObj = {
      ...req.body,
      collegeEmail: user.email,
      userId: req.auth._id,
    };
    const course = await Courses.findOne({ _id: req.body.courseId });
    if (!course) {
      return res.status(400).json({ msg: "Course does not exist" });
    }
    studentObj.courseName = course.courseName;

    const department = await Departments.findOne({
      _id: req.body.departmentId,
    });
    if (!department) {
      return res.status(400).json({ msg: "Department does not exist" });
    }
    studentObj.departmentName = department.departmentName;
    const newStudent = new Students(studentObj);
    await newStudent.save();
    await Users.updateOne(
      { _id: req.auth._id },
      { $push: { roles: "STUDENT" } }
    );
    res.json({ student: newStudent, msg: "Registered Successfully" });
  } catch (error) {
    console.log("Error occurred in /studentRegister", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};
exports.getPlacedList=async (req,res)=>{
  try {
    const teamMembers = await Student.find({ isPlaced: true  },"name designation phoneNo altPhoneNo department collegeEmail personalEmail company maxCTCOffered")
    .then(users => {console.log("yes",users)
  
  res.json(users)})
    .catch(err => console.log(err));
    console.log("no",teamMembers)
  
  } catch (error) {
    console.log("Error occurred in /viewTeam", error);
    res.status(500).json({ error: "Some error occurred" });
  }
}
exports.getUnplacedList=async (req,res)=>{
  try {
    const teamMembers = await Student.find({ isPlaced: false  },"name designation phoneNo altPhoneNo department collegeEmail personalEmail resumeLink linkedin")
    .then(users => {console.log("yes",users)
  
  res.json(users)})
    .catch(err => console.log(err));
    console.log("no",teamMembers)
  
  } catch (error) {
    console.log("Error occurred in /viewTeam", error);
    res.status(500).json({ error: "Some error occurred" });
  }
}

exports.getPlacementData = async (req, res) => {
  try {
      // const allStudents = await Students.find({});
      const placedStudents = await Students.find({ isPlaced: true });
      // const unplacedStudents = await Students.find({ isPlaced: false });
      const participatingStudentsCount = await Students.countDocuments({ isParticipatingInPlacements: true });
  
      const placedSalaries = placedStudents.map(student => student.maxCTCOffered);
      const highestSalary = Math.max(...placedSalaries);
      const lowestSalary = Math.min(...placedSalaries);
  
      const salaryRanges = [
        { label: '0 - 10 LPA', count: 0 },
        { label: '10 - 15 LPA', count: 0 },
        { label: '15 - 20 LPA', count: 0 },
        { label: '20 - 25 LPA', count: 0 },
        { label: '25 - 30 LPA', count: 0 },
        { label: '30 - 35 LPA', count: 0 },
        { label: '35 - 40 LPA', count: 0 },
        { label: '40 - 45 LPA', count: 0 },
        { label: '45 - 50 LPA', count: 0 },
        { label: '> 50 LPA', count: 0 }
      ];
  
      placedStudents.forEach(student => {
        const salary = student.maxCTCOffered;
        if (salary < 10) {
          salaryRanges[0].count += 1;
        } else if (salary < 15) {
          salaryRanges[1].count += 1;
        } else if (salary < 20) {
          salaryRanges[2].count += 1;
        } else if (salary < 25) {
          salaryRanges[3].count += 1;
        } else if (salary < 30) {
          salaryRanges[4].count += 1;
        } else if (salary < 35) {
          salaryRanges[5].count += 1;
        } else if (salary < 40) {
          salaryRanges[6].count += 1;
        } else if (salary < 45) {
          salaryRanges[7].count += 1;
        } else if (salary < 50) {
          salaryRanges[8].count += 1;
        } else {
          salaryRanges[9].count += 1;
        }
      });
  
    const avgSalary = (placedSalaries.reduce((a, b) => a + b, 0) / placedSalaries.length).toFixed(2);
    let medianSalary;
    const midIndex = Math.floor(placedSalaries.length/2);
    if (placedSalaries.length % 2 === 0) {
      medianSalary = ((placedSalaries[midIndex - 1] + placedSalaries[midIndex])/2).toFixed(2);
    } else {
      medianSalary = placedSalaries[midIndex].toFixed(2);
    }
      
      const PlacedCount = placedStudents.length;
      // const totalUnplacedCount = unplacedStudents.length;
      // const totalStudentsCount = allStudents.length;
  
      res.status(200).json({
        placementStats: {
          participatingStudentsCount,
          PlacedCount,
          highestPackage: highestSalary,
          lowestPackage: lowestSalary,
          averagePackage: avgSalary,
          medianPackage: medianSalary,
        },
        chartData: { salaryRanges }
      });
  } catch (error) {
      console.log(error);
      res.status(500).json( { error: 'Error in getting placement data' } );
    }  
}

exports.getStudentProfile = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.auth.studentId;
    let student = (await Students.findOne({ _id: studentId }))?._doc;
    const highSchoolGrades = await HighSchoolGrades.findOne({
      studentId,
    });
    if (highSchoolGrades) {
      student.highSchoolGrades = highSchoolGrades;
    }
    const intermediateGrades = await IntermediateGrades.findOne({
      studentId,
    });
    if (intermediateGrades) {
      student.intermediateGrades = intermediateGrades;
    }
    const graduationGrades = await GraduationGrades.findOne({
      studentId,
    });
    if (graduationGrades) {
      student.graduationGrades = graduationGrades;
    }
    const cgpaGrades = await CGPAGrades.findOne({ studentId });
    if (cgpaGrades) {
      student.cgpaGrades = cgpaGrades;
    }
    const address = await Addresses.findOne({ studentId });
    if (address) {
      student.address = address;
    }
    res.json({ ...student });
  } catch (error) {
    console.log("Error occurred in /getStudentProfile", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};

exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.body.studentId || req.auth.studentId;
    await Students.updateOne({ _id: studentId }, req.body);
    if (req.body.highSchoolGrades) {
      const highSchoolGrades = await HighSchoolGrades.findOne({ studentId });
      if (highSchoolGrades) {
        await HighSchoolGrades.updateOne(
          { studentId },
          req.body.highSchoolGrades
        );
      } else {
        const newHighSchoolGrades = new HighSchoolGrades({
          ...req.body.highSchoolGrades,
          studentId,
        });
        await newHighSchoolGrades.save();
      }
    }
    if (req.body.intermediateGrades) {
      const intermediateGrades = await IntermediateGrades.findOne({
        studentId,
      });
      if (intermediateGrades) {
        await IntermediateGrades.updateOne(
          { studentId },
          req.body.intermediateGrades
        );
      } else {
        const newIntermediateGrades = new IntermediateGrades({
          ...req.body.intermediateGrades,
          studentId,
        });
        await newIntermediateGrades.save();
      }
    }
    if (req.body.graduationGrades) {
      const graduationGrades = await GraduationGrades.findOne({ studentId });
      if (graduationGrades) {
        await GraduationGrades.updateOne(
          { studentId },
          req.body.graduationGrades
        );
      } else {
        const newGraduationGrades = new GraduationGrades({
          ...req.body.graduationGrades,
          studentId,
        });
        await newGraduationGrades.save();
      }
    }
    if (req.body.cgpaGrades) {
      const cgpaGrades = await CGPAGrades.findOne({ studentId });
      if (cgpaGrades) {
        await CGPAGrades.updateOne({ studentId }, req.body.cgpaGrades);
      } else {
        const newCGPAGrades = new CGPAGrades({
          ...req.body.graduationGrades,
          studentId,
        });
        await newCGPAGrades.save();
      }
    }
    if (req.body.address) {
      const address = await Addresses.findOne({ studentId });
      if (address) {
        await Addresses.updateOne({ studentId }, req.body.address);
      } else {
        const newAddress = new Addresses({
          ...req.body.address,
          studentId,
        });
        await newAddress.save();
      }
    }
    res.json({ msg: "Profile updated successfully" });
  } catch (error) {
    console.log("Error occurred in /updateStudentProfile", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};

exports.getStudentList = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const entriesPerPage = Number(req.query.entriesPerPage) || 10;
    const minCGPA = req.query.minCGPA || 0;
    const aggregateCGPASemester = Number(req.query.aggregateCGPASemester) || 0;
  
    const courseCredits = await CourseCredits.findOne({
      courseId: req.query.courseId,
      year: req.query.passingYear,
    });

    let findObj = {};

    findObj.courseId = mongoose.Types.ObjectId(req.query.courseId);
    findObj.passingYear = Number(req.query.passingYear);
    if (req.query.departmentId) {
      findObj.departmentId = req.query.departmentId;
    }
    if (req.query.gender) {
      findObj.gender = req.query.gender;
    }
    if (req.query.dreamLPA && Number(req.query.dreamLPA)) {
      findObj.maxCTCOffered = { $lte: Number(req.query.dreamLPA) };
    }
    if (req.query.isParticipatingInPlacements) {
      if (req.query.isParticipatingInPlacements === "true") {
        findObj.isParticipatingInPlacements = true;
      } else if (req.query.isParticipatingInPlacements === "false"){
        findObj.isParticipatingInPlacements = false;
      }
      // findObj.isParticipatingInPlacements = Boolean(
      //   req.query.isParticipatingInPlacements
      // );
    }
    let sortObj = { collegeEmail: 1, _id: 1 };
    let students = {};

    if (req.query.searchQuery) {
      students = await Students.aggregate([
        {
          $search: {
            index: "Student",
            text: { query: req.query.searchQuery, path: { wildcard: "*" } },
          },
        },
        {
          $match: findObj,
        },
        {
          $sort: sortObj,
        },
      ]);
    } else {
      students = await Students.find(findObj).sort(sortObj).exec();
    }

    let data = await Promise.all(
      students.map(async (student) => {
        student = student._doc || student;
        const studentId = student._id;
        const highSchoolGrades = await HighSchoolGrades.findOne({
          studentId,
        });
        if (highSchoolGrades) {
          student.highSchoolGrades = highSchoolGrades;
        }
        const intermediateGrades = await IntermediateGrades.findOne({
          studentId,
        });
        if (intermediateGrades) {
          student.intermediateGrades = intermediateGrades;
        }
        const graduationGrades = await GraduationGrades.findOne({
          studentId,
        });
        if (graduationGrades) {
          student.graduationGrades = graduationGrades;
        }
        const address = await Addresses.findOne({ studentId });
        if (address) {
          student.address = address;
        }
        const cgpaGrades = await CGPAGrades.findOne({ studentId });
        if (cgpaGrades) {
          student.cgpaGrades = cgpaGrades;
        }

        let courseCreditSum = 0,
          aggregateCGPA = 0;
        student.aggregateCGPASemester = 0;
        for (let semester = 1; semester <= aggregateCGPASemester; semester++) {
          if (
            !cgpaGrades[`semester${semester}`] ||
            !courseCredits[`semester${semester}`]
          )
            break;
          student.aggregateCGPASemester++;
          courseCreditSum += courseCredits[`semester${semester}`];
          aggregateCGPA +=
            courseCredits[`semester${semester}`] *
            cgpaGrades[`semester${semester}`];
        }
        if (aggregateCGPA) aggregateCGPA = aggregateCGPA / courseCreditSum;
        student.aggregateCGPA = aggregateCGPA;

        if (student.aggregateCGPA >= minCGPA) return student;
      })
    );

    let studentCount = 0;

    data = data.filter((e) => {
      if (!e) return false;
      studentCount++;
      if (
        studentCount > (page - 1) * entriesPerPage &&
        studentCount <= page * entriesPerPage
      )
        return true;
      return false;
    });

    if (req.query.sortByCGPA) {
      if (req.query.sortByCGPA == 1) {
        data = data.sort((a, b) =>
          a.aggregateCGPA < b.aggregateCGPA ? -1 : 1
        );
      } else {
        data = data.sort((a, b) =>
          a.aggregateCGPA <= b.aggregateCGPA ? 1 : -1
        );
      }
    }

    res.json({
      totalPages: Math.ceil(studentCount / entriesPerPage),
      data,
      courseCredits,
    });
  } catch (error) {
    console.log("Error occurred in /getStudentList", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};
exports.getStudentListForTpo = async (req, res) => {
  try {
    //console.log(req.query)
    const page = req.query.page || 1;
    const entriesPerPage = Number(req.query.entriesPerPage) || 10;
    const minCGPA = req.query.minCGPA || 0;
    const aggregateCGPASemester = Number(req.query.aggregateCGPASemester) || 0;
    /^abx/
    const regex = new RegExp("^"+req.query.searchQuery, 'i');
    var temp=[]
await Student.find({ name: { $regex: regex } })
  .then(users => {
    // handle the result
   temp=users
   
  })
  .catch(error => {
    // handle the error
  });
 //console.log(temp);

  var data=[]
  // for(let i=0;i<temp.length;i++) {
  //   console.log(temp[i]);
  // }
  console.log(temp.length)
  temp.forEach(function (users) {
    console.log(users)
var obj={
_id:users._id,
name:users.name,
personalEmail:users.personalEmail,
collegeEmail:users.collegeEmail,
courseName:users.courseName,
departmentName:users.departmentName,
photo:users.photo,
gender:users.gender,
phoneNo:users.phoneNo,
altPhoneNo:users.altPhoneNo,
enrollmentNo:users.enrollmentNo,
designation:users.designation,
}
data.push(obj);
// result=[...result,obj];
})
console.log(data)







   
      // findObj.isParticipatingInPlacements = Boolean(
      //   req.query.isParticipatingInPlacements
      // );
    
   

    res.json({
      totalPages: Math.ceil(temp.length / entriesPerPage),
      data,
     
    });
  } catch (error) {
    console.log("Error occurred in /getStudentList", error);
    res.status(500).json({ error: "Some error occurred" });
  }
};
