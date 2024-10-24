import Task from '../../models/taskModel.js'
import Project from '../../models/projectModel.js'
import User from '../../models/suserModel.js';
import TestCase from '../../models/testCasesModel.js';
import BugReport from '../../models/bugReportModel.js'
import ReAssign from '../../models/reAssignModel.js';
import { Op } from 'sequelize'; 


export const listAllTasks  = async (req, res) => {
    try {
     
        const tasks = await Task.findAll({
            include: [
              {
                model: Project,
                attributes: ['name'], 
              },
              {
                model: User,
                as: 'assignedUser',
                attributes: ['name', 'role'], 
              },
            ],
          });
          
      
          res.json(tasks);
        
    } catch (error) {
        console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
        
    }
}

export const dashboardCount  = async (req, res) => {
  try {
    const newTasksCount = await Task.count({
      where: { isCompleted: false },
    });

    // Count of tasks where isCompleted is true but not verified by admin (Tasks to Test)
    const taskToTestCount = await Task.count({
      where: { 
        isCompleted: true,
        isVerifiedByAdmin: false
      },
    });

    // Count of tasks where isVerifiedByAdmin is true (Tasks Tested Completed)
    const tasksTestedCompletedCount = await Task.count({
      where: { isVerifiedByAdmin: true },
    });
    


    // Return the counts as a response
    res.json({
      newTasks: newTasksCount,
      taskToTest: taskToTestCount,
      tasksTestedCompleted: tasksTestedCompletedCount,
    });
    
  } catch (error) {
    console.error('Error fetching task counts:', error);
    res.status(500).json({ message: 'Error fetching task counts' });
    
  }
}

export const  listTestCases = async (req, res) => {
  try {
    console.log('jhjh',req.params.id);
    const testCases = await TestCase.findAll({
      where: {
        taskId: req.params.id  
      }
    });
   
    res.json(testCases);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching test cases' });
    
  }
}



export const  testCaseCreation  = async (req, res) => {
  try {
    console.log('test',req.body);
    console.log('testParams',req.params);

    const { id } = req.params;
    const taskId=id
  const { name, description, steps } = req.body;
  

    const testCase = await TestCase.create({
      name,
      description,
      steps,
      taskId, // Associate the test case with the task
    });

    res.status(201).json(testCase);

    
  } catch (error) {
    console.error('Error creating test case:', error);
    res.status(500).json({ message: 'Error creating test case' });
    
  }
}

export const updateBugReport  = async (req, res) => {
  try {
    console.log('dfb');
    console.log('req',req.body);
    console.log('file',req.files);
    const {
      taskId,
      testerId,
      testCaseId,
    
      severity,
      testStatus,
      result,
      selectedSteps,
    } = req.body;
    let  steps=[]
    steps=selectedSteps
    console.log('seele',steps);

    if (!severity || !result || !steps || !testCaseId || !taskId || !testerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const files = req.files;

    // If there are files, store their file paths
    let filePaths = [];
    if (files) {
      filePaths = files.map((file) => {
        return `/uploads/${file.filename}`;
      });
    }

    const newBugReport = await BugReport.create({
      severity,
      result,
      steps,
      testStatus,
      testCaseId,
      taskId,
      testerId,
      fileLink:filePaths
    });
    

    return res.status(201).json({
      message: 'Bug report created successfully',
      bugReport: newBugReport,
    });
    
  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
    
  }
}

export const listSubmitterReport =async (req, res) => {
  try {
    const { testerId } = req.params;

    const reports = await BugReport.findAll({
      where: { testerId },
      include: [
        { model: TestCase, as: 'testCase' ,attributes: ['name', 'description'],},
        { model: Task, as: 'task' },
      ],
    });

    // console.log('reportzz',reports);

    if (!reports.length) {
      return res.status(404).json({ message: 'No reports found for this tester.' });
    }

    return res.status(200).json(reports);
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
    
  }
}

export const testerProfile = async (req, res) => {
  

  // Destructure userId from req.params
  const { Id } = req.params;
  

  try {
    const user = await User.findOne({
      where: { id: Id },
    });
  
    
    // Send the user data as JSON response
    res.json(user);
  } catch (error) {
    // Handle the error and respond appropriately
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'An error occurred while fetching the user profile.' });
  }
};


export const editTesterProfile=async (req, res) => {
  const { userId } = req.params;
  const { name, phoneNumber } = req.body;

  try {
    const user = await User.update(
      { name,  phoneNumber },
      { where: { id: userId } }
    );
    
    if (user[0] === 1) {
      res.status(200).json({ message: 'Profile updated successfully' });
    } else {
      res.status(400).json({ message: 'Failed to update profile' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listReassigned= async(req,res)=>{
  try {
    console.log('data');

    const reAssignedTasks = await ReAssign.findAll({
      include: [
        { model: Task, as: 'task', attributes: ['TaskName','description','status'] },
        { model: Project, as: 'project', attributes: ['name'] },
        { model: User, as: 'tester', attributes: ['name'] },
        { model: User, as: 'previousDeveloper', attributes: ['name'] },
        { model: User, as: 'reassignedTo', attributes: ['name'] },
        { model: BugReport, as: 'bugReport', attributes: ['severity','steps','fileLink'] },
      ],
    });

    console.log('resa',reAssignedTasks);

    
    res.json(reAssignedTasks);
    
  } catch (error) {
    
  }
}