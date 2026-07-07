// The in-scope L2 stages of the onboarding map (numbers keep the hierarchy's
// L2 numbering; titles are the Excel's L2 names). Scope = the client's green
// + yellow highlighted activities. Out-of-scope stages are omitted entirely.
export const STAGES = [
  {
    n: 1, title: 'Pre-boarding & Offer Acceptance',
    activities: [
      { code: '1.1.1', persona: 'HR recruiter', label: 'Generate conditional offer letter', mode: 'ai', agents: ['HCM_40', 'HCM_53', 'HCM_92'], trigger: 'Approved requisition' },
      { code: '1.1.2', persona: 'Candidate', label: 'Send offer & track acceptance', mode: 'ai', agents: ['HCM_95', 'HCM_94'], trigger: 'Offer approved for dispatch' },
      { code: '1.2.1', persona: 'HR', label: 'Initiate background & reference checks', mode: 'ai', agents: ['HCM_98'], trigger: 'Offer accepted' },
      { code: '1.3.1', persona: 'Employee', label: 'Send welcome pack & first-day instructions', mode: 'ai', agents: ['HCM_146', 'HCM_55'], trigger: 'Offer accepted' },
      { code: '1.3.2', persona: 'Employee', label: 'Collect new-hire data (bank, tax, emergency contacts)', mode: 'ai', agents: ['HCM_67', 'HCM_54'], trigger: 'Welcome pack delivered' },
      { code: '1.3.3', persona: 'Employee', label: 'Assign onboarding journey & task checklist', mode: 'ai', agents: ['HCM_54', 'HCM_44'], trigger: 'Pre-boarding data complete' },
    ],
  },
  {
    n: 2, title: 'Identity Provisioning & System Access',
    activities: [
      { code: '2.1.1', persona: 'System', label: 'Convert candidate to employee in HCM', mode: 'system' },
      { code: '2.1.2', persona: 'System', label: 'Assign employee number & org unit', mode: 'system' },
      { code: '2.1.3', persona: 'HR', label: 'Validate personal data completeness', mode: 'ai', agents: ['HCM_31', 'HCM_1'], trigger: 'Personal data submitted' },
      { code: '2.2.1', persona: 'IT', label: 'Create AD / SSO account', mode: 'ai', agents: ['HCM_89', 'HCM_12', 'HCM_75'], trigger: 'Worker record created' },
      { code: '2.2.3', persona: 'IT', label: 'Grant role-based application access', mode: 'ai', agents: ['HCM_152'], trigger: 'AD / SSO account created' },
    ],
  },
  {
    n: 3, title: 'Role Assignment & Equipment',
    activities: [
      { code: '3.1.3', persona: 'Manager', label: 'Define work schedule & location', mode: 'ai', agents: ['HCM_73', 'HCM_6'], trigger: 'Position profile' },
      { code: '3.2.1', persona: 'HR', label: 'Determine equipment entitlement by role', mode: 'ai', agents: ['HCM_149'], trigger: 'Position profile' },
      { code: '3.2.2', persona: 'System', label: 'Raise equipment request / purchase requisition', mode: 'ai', trigger: 'Entitlement determined' },
      { code: '3.2.3', persona: 'Employee', label: 'Track delivery & confirm receipt', mode: 'system' },
      { code: '3.3.1', persona: 'IT', label: 'Allocate desk / workspace', mode: 'human' },
      { code: '3.3.2', persona: 'IT', label: 'Set up workstation (image, peripherals)', mode: 'human' },
    ],
  },
  {
    n: 4, title: 'Benefits Enrolment',
    activities: [
      { code: '4.1.1', persona: 'System', label: 'Trigger new-hire enrolment event', mode: 'system' },
      { code: '4.1.2', persona: 'Employee', label: 'Present eligible benefit plans', mode: 'ai', agents: ['HCM_4', 'HCM_5'], trigger: 'Enrolment window opens' },
      { code: '4.1.3', persona: 'Employee', label: 'Answer new-hire benefits questions', mode: 'ai', agents: ['HCM_2', 'HCM_90'], trigger: 'Employee question in chat' },
      { code: '4.2.1', persona: 'Employee', label: 'Employee selects plans & dependants', mode: 'ai', agents: ['HCM_4'], trigger: 'Plans presented' },
      { code: '4.2.2', persona: 'System', label: 'Validate enrolment & dependant eligibility', mode: 'system' },
    ],
  },
  {
    n: 5, title: 'Mandatory Training & Compliance',
    activities: [
      { code: '5.1.1', persona: 'HR', label: 'Determine required training by role & location', mode: 'ai', agents: ['HCM_45', 'HCM_123'], trigger: 'Role confirmed' },
      { code: '5.1.2', persona: 'System', label: 'Assign learning items to new hire', mode: 'system' },
      { code: '5.1.3', persona: 'System', label: 'Notify new hire of training schedule', mode: 'system' },
      { code: '5.2.1', persona: 'Employee', label: 'Employee completes e-learning modules', mode: 'ai', agents: ['HCM_46', 'HCM_52'], trigger: 'Training assigned' },
      { code: '5.2.2', persona: 'Employee', label: 'Attend instructor-led sessions (safety, compliance)', mode: 'human' },
      { code: '5.2.3', persona: 'Employee', label: 'Complete assessments & certifications', mode: 'ai', agents: ['HCM_46'], trigger: 'Modules complete' },
      { code: '5.3.1', persona: 'HR', label: 'Monitor training completion against deadlines', mode: 'ai', agents: ['HCM_120', 'HCM_95'], trigger: 'Training in progress' },
      { code: '5.3.2', persona: 'System', label: 'Send reminders for overdue training', mode: 'system' },
      { code: '5.3.3', persona: 'HR', label: 'Report compliance status to HR / audit', mode: 'ai', agents: ['HCM_153'], trigger: 'Training records updated' },
    ],
  },
  {
    n: 6, title: 'First-day Orientation',
    activities: [
      { code: '6.2.1', persona: 'Employee', label: 'Walk through self-service HR portal', mode: 'ai', agents: ['HCM_90', 'HCM_15'], trigger: 'Day 1' },
      { code: '6.2.2', persona: 'IT', label: 'Confirm system access is working', mode: 'ai', agents: ['HCM_152'], trigger: 'Accounts provisioned' },
      { code: '6.2.3', persona: 'Employee', label: 'Set up personal preferences', mode: 'human' },
      { code: '6.3.1', persona: 'Manager', label: 'Schedule meet-the-team sessions', mode: 'ai', trigger: 'Day 1' },
      { code: '6.3.2', persona: 'Manager', label: 'Assign buddy / mentor', mode: 'ai', agents: ['HCM_79'], trigger: 'Day 1' },
    ],
  },
  {
    n: 7, title: 'Goal Setting & Role Enablement',
    activities: [
      { code: '7.1.1', persona: 'Manager', label: 'Manager drafts 30-60-90 day objectives', mode: 'ai', agents: ['HCM_17', 'HCM_83'], trigger: 'Start date confirmed' },
      { code: '7.1.2', persona: 'HR', label: 'Align goals with department / org objectives', mode: 'ai', agents: ['HCM_113'], trigger: 'Goals drafted' },
      { code: '7.1.3', persona: 'Employee', label: 'New hire acknowledges & accepts goals', mode: 'human' },
    ],
  },
  {
    n: 8, title: 'Check-ins & Probation Review',
    activities: [
      { code: '8.1.1', persona: 'Manager', label: 'Schedule Week 1 / Week 2 / Month 1 check-ins', mode: 'ai', agents: ['HCM_95'], trigger: 'Day 1' },
      { code: '8.1.2', persona: 'Manager', label: 'Prepare check-in agenda & talking points', mode: 'ai', agents: ['HCM_125', 'HCM_85'], trigger: 'Check-in scheduled' },
      { code: '8.1.3', persona: 'Manager', label: 'Conduct check-in & record notes', mode: 'ai', agents: ['HCM_119'], trigger: 'Check-in due' },
      { code: '8.1.4', persona: 'Manager', label: 'Track action items from check-ins', mode: 'ai', agents: ['HCM_95'], trigger: 'Check-in complete' },
      { code: '8.2.2', persona: 'HR', label: 'Assess onboarding progress against checklist', mode: 'ai', agents: ['HCM_97'], trigger: 'Day-30 review' },
      { code: '8.3.2', persona: 'Manager', label: 'Assess skill development & training completion', mode: 'ai', agents: ['HCM_76', 'HCM_52'], trigger: 'Day-60 review' },
      { code: '8.4.1', persona: 'Manager', label: 'Manager completes final probation review', mode: 'ai', agents: ['HCM_81', 'HCM_111'], trigger: 'Day-90 milestone' },
      { code: '8.4.2', persona: 'Manager', label: 'Decision: confirm / extend / terminate', mode: 'human' },
      { code: '8.4.3', persona: 'System', label: 'Update employee status & notify', mode: 'system' },
    ],
  },
];

// Live status per stage, derived from the shared case state.
export function stageStatus(stage, c) {
  const doneMap = {
    1: c.journey.published,
    2: c.provisioning.status === 'done',
    3: c.schedule.status === 'confirmed',
    4: c.benefits.status === 'enrolled',
    5: ['compiled', 'decided'].includes(c.probation.status),
    6: c.provisioning.status === 'done',
    7: ['compiled', 'decided'].includes(c.probation.status),
    8: c.probation.status === 'decided',
  };
  if (doneMap[stage.n]) return 'done';
  const activeMap = {
    1: true,
    2: c.provisioning.status === 'ready',
    3: c.schedule.status === 'proposed',
    4: ['open', 'flagged'].includes(c.benefits.status),
    5: c.probation.status === 'ready',
    6: c.schedule.status === 'confirmed' && c.provisioning.status !== 'done',
    7: c.probation.status === 'ready',
    8: ['ready', 'compiled'].includes(c.probation.status),
  };
  return activeMap[stage.n] ? 'active' : 'upcoming';
}
