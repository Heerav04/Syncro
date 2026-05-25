'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { RequireAuth, RoleText } from '@/components/RoleGate';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase/client';
import { Attachment, Attendance, Company, Task, Team, User, UserRole } from '@/types';

type View = 'workspace' | 'teams' | 'members';
type ShiftSettings = { start: string; end: string };

const views: Array<{ id: View; label: string }> = [
  { id: 'workspace', label: 'Workspace' },
  { id: 'teams', label: 'Teams' },
  { id: 'members', label: 'Members' },
];

const blankShift: ShiftSettings = { start: '09:00', end: '17:00' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>('workspace');
  const [company, setCompany] = useState<Company | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [workspaceInput, setWorkspaceInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', leadId: '' });
  const [memberForm, setMemberForm] = useState({ displayName: '', email: '', role: 'member' as UserRole });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', priority: 'medium' });
  const [taskFiles, setTaskFiles] = useState<File[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [attendanceTask, setAttendanceTask] = useState<Task | null>(null);
  const [nowText, setNowText] = useState('');
  const [shift, setShift] = useState<ShiftSettings>(blankShift);
  const [alarmArmed, setAlarmArmed] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState('');
  const [alarmKey, setAlarmKey] = useState('');

  const currentRole = profile?.role || 'member';
  const isAdmin = currentRole === 'companyAdmin' || currentRole === 'superAdmin';
  const canManageTeams = isAdmin || currentRole === 'teamLead';
  const canReviewWork = canManageTeams;
  const memberAliases = useMemo(() => getMemberAliases(user, profile), [profile, user]);
  const workspaceId = company?.id || '';

  const visibleTeams = useMemo(() => {
    if (isAdmin) return teams;
    return teams.filter((team) => (
      memberAliases.includes(team.leadId) ||
      team.memberIds.some((memberId) => memberAliases.includes(memberId))
    ));
  }, [isAdmin, memberAliases, teams]);

  const selectedTeam = visibleTeams.find((team) => team.id === selectedTeamId);
  const teamMembers = useMemo(() => {
    const ids = new Set(selectedTeam?.memberIds || []);
    return users.filter((person) => ids.has(person.uid));
  }, [selectedTeam?.memberIds, users]);
  const assignableUsers = selectedTeam ? teamMembers : users;
  const myTasks = tasks.filter((task) => task.assigneeId && memberAliases.includes(task.assigneeId));
  const submittedTasks = tasks.filter((task) => task.submittedAt);
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((entry) => entry.date === today);

  const openWorkspaceById = useCallback(
    async (rawWorkspaceId: string, silent = false) => {
      if (!user) return;

      const nextWorkspaceId = slugify(rawWorkspaceId);
      if (!nextWorkspaceId) {
        setError('Enter a workspace name like acme or design-team.');
        return;
      }

      setLoading(true);
      setError('');
      setMessage('');

      try {
        const timestamp = new Date().toISOString();
        const companyRef = doc(db, 'companies', nextWorkspaceId);
        const companySnap = await getDoc(companyRef);
        const ownerProfile = createUserProfile(user, nextWorkspaceId, 'companyAdmin');

        if (!companySnap.exists()) {
          const nextCompany: Company = {
            id: nextWorkspaceId,
            name: nextWorkspaceId,
            domain: '',
            plan: 'starter',
            createdBy: user.uid,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          await setDoc(companyRef, nextCompany);
          await setDoc(doc(db, 'companies', nextWorkspaceId, 'users', user.uid), ownerProfile);
          setCompany(nextCompany);
          setProfile(ownerProfile);
          window.localStorage.setItem('collabwork.companyId', nextWorkspaceId);
          if (!silent) setMessage(`Workspace "${nextWorkspaceId}" created.`);
          return;
        }

        const companyData = companySnap.data() as Company;
        const uidProfileRef = doc(db, 'companies', nextWorkspaceId, 'users', user.uid);
        const emailProfileRef = doc(db, 'companies', nextWorkspaceId, 'users', emailKey(user.email || ''));
        const [uidProfileSnap, emailProfileSnap] = await Promise.all([
          getDoc(uidProfileRef),
          user.email ? getDoc(emailProfileRef) : Promise.resolve(null),
        ]);

        if (uidProfileSnap.exists()) {
          const nextProfile = uidProfileSnap.data() as User;
          await updateDoc(uidProfileRef, {
            displayName: user.displayName || nextProfile.displayName || 'You',
            email: user.email || nextProfile.email,
            isActive: true,
            updatedAt: timestamp,
          });
          setCompany(companyData);
          setProfile({ ...nextProfile, displayName: user.displayName || nextProfile.displayName || 'You' });
          window.localStorage.setItem('collabwork.companyId', nextWorkspaceId);
          return;
        }

        if (emailProfileSnap?.exists()) {
          const invitedProfile = emailProfileSnap.data() as User;
          await updateDoc(emailProfileRef, {
            displayName: invitedProfile.displayName || user.displayName || 'You',
            email: user.email || invitedProfile.email,
            isActive: true,
            pending: false,
            updatedAt: timestamp,
          });
          setCompany(companyData);
          setProfile({ ...invitedProfile, pending: false });
          window.localStorage.setItem('collabwork.companyId', nextWorkspaceId);
          return;
        }

        throw new Error(
          `No member invite was found for ${user.email || 'this account'} in workspace "${nextWorkspaceId}". Ask the workspace admin or lead to add that email first.`
        );
      } catch (err) {
        setCompany(null);
        setProfile(null);
        setUsers([]);
        setTeams([]);
        setTasks([]);
        setAttendance([]);
        setError(err instanceof Error ? err.message : 'Workspace could not be opened.');
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    const storedWorkspaceId = window.localStorage.getItem('collabwork.companyId');
    if (storedWorkspaceId) {
      void openWorkspaceById(storedWorkspaceId, true);
    } else {
      setLoading(false);
    }
  }, [openWorkspaceById, user]);

  useEffect(() => {
    if (!company || !profile) return;

    const teamCollection = collection(db, 'companies', company.id, 'teams');
    const teamsQuery = canManageTeams
      ? query(teamCollection, orderBy('name'))
      : query(teamCollection, where('memberIds', 'array-contains-any', memberAliases.slice(0, 30)));
    const unsubscribeTeams = onSnapshot(
      teamsQuery,
      (snapshot) => setTeams(snapshot.docs.map((teamDoc) => teamDoc.data() as Team)),
      (err) => setError(err.message)
    );

    if (!canManageTeams) {
      setUsers([profile]);
      return () => unsubscribeTeams();
    }

    const usersQuery = query(collection(db, 'companies', company.id, 'users'), orderBy('displayName'));
    const unsubscribeUsers = onSnapshot(
      usersQuery,
      (snapshot) => setUsers(snapshot.docs.map((userDoc) => userDoc.data() as User)),
      (err) => setError(err.message)
    );

    return () => {
      unsubscribeTeams();
      unsubscribeUsers();
    };
  }, [canManageTeams, company, memberAliases, profile]);

  useEffect(() => {
    if (!visibleTeams.length) {
      setSelectedTeamId('');
      return;
    }

    if (!selectedTeamId || !visibleTeams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(visibleTeams[0].id);
    }
  }, [selectedTeamId, visibleTeams]);

  useEffect(() => {
    if (!company || !selectedTeamId || !memberAliases.length) {
      setTasks([]);
      setAttendance([]);
      return;
    }

    const taskCollection = collection(db, 'companies', company.id, 'teams', selectedTeamId, 'tasks');
    const attendanceCollection = collection(db, 'companies', company.id, 'teams', selectedTeamId, 'attendance');
    const tasksQuery = canReviewWork
      ? query(taskCollection, orderBy('updatedAt', 'desc'))
      : query(taskCollection, where('assigneeId', 'in', memberAliases.slice(0, 30)));
    const attendanceQuery = canReviewWork
      ? query(attendanceCollection, orderBy('markedAt', 'desc'))
      : query(attendanceCollection, where('userId', 'in', memberAliases.slice(0, 30)));

    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((taskDoc) => taskDoc.data() as Task)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setTasks(nextTasks);
      },
      (err) => setError(err.message)
    );
    const unsubscribeAttendance = onSnapshot(
      attendanceQuery,
      (snapshot) => {
        const nextAttendance = snapshot.docs
          .map((attendanceDoc) => attendanceDoc.data() as Attendance)
          .sort((a, b) => b.markedAt.localeCompare(a.markedAt));
        setAttendance(nextAttendance);
      },
      (err) => setError(err.message)
    );

    return () => {
      unsubscribeTasks();
      unsubscribeAttendance();
    };
  }, [canReviewWork, company, memberAliases, selectedTeamId]);

  useEffect(() => {
    const storedShift = window.localStorage.getItem('syncro.shift');
    if (storedShift) {
      try {
        setShift(JSON.parse(storedShift) as ShiftSettings);
      } catch {
        setShift(blankShift);
      }
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = new Date();
      setNowText(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (!alarmArmed) return;
      const key = current.toISOString().slice(0, 10);
      const currentTime = current.toTimeString().slice(0, 5);
      if (currentTime === shift.end && alarmKey !== key) {
        setAlarmKey(key);
        ringShiftAlarm(shift.end, setAlarmMessage);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [alarmArmed, alarmKey, shift.end]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const openWorkspace = (event: FormEvent) => {
    event.preventDefault();
    void openWorkspaceById(workspaceInput);
    setWorkspaceInput('');
  };

  const saveShift = (nextShift: ShiftSettings) => {
    setShift(nextShift);
    window.localStorage.setItem('syncro.shift', JSON.stringify(nextShift));
    setAlarmMessage('Shift saved for this browser.');
  };

  const createTeam = async (event: FormEvent) => {
    event.preventDefault();
    if (!company || !profile || !canManageTeams) return;

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const teamRef = doc(collection(db, 'companies', company.id, 'teams'));
      const leadId = isAdmin ? teamForm.leadId || profile.uid : profile.uid;
      const timestamp = new Date().toISOString();
      const team: Team = {
        id: teamRef.id,
        companyId: company.id,
        name: teamForm.name.trim(),
        description: teamForm.description.trim(),
        leadId,
        editorIds: [],
        memberIds: Array.from(new Set([leadId])),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await setDoc(teamRef, team);
      await updateDoc(doc(db, 'companies', company.id, 'users', leadId), {
        role: 'teamLead',
        teamId: teamRef.id,
        updatedAt: timestamp,
      });
      setSelectedTeamId(teamRef.id);
      setTeamForm({ name: '', description: '', leadId: '' });
      setMessage('Team created.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team.');
    } finally {
      setSaving(false);
    }
  };

  const addWorkspaceMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!company || !canManageTeams) return;

    const email = memberForm.email.trim().toLowerCase();
    const displayName = memberForm.displayName.trim();
    if (!email || !displayName) {
      setError('Member name and email are required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const timestamp = new Date().toISOString();
      const memberId = emailKey(email);
      const member: User = {
        uid: memberId,
        email,
        displayName,
        companyId: company.id,
        teamId: '',
        role: memberForm.role,
        pending: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        isActive: true,
      };
      await setDoc(doc(db, 'companies', company.id, 'users', memberId), member, { merge: true });
      setMemberForm({ displayName: '', email: '', role: 'member' });
      setMessage('Member added. They can sign in with this email and open this workspace slug.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member.');
    } finally {
      setSaving(false);
    }
  };

  const addMemberToSelectedTeam = async (memberId: string) => {
    if (!company || !selectedTeam || !memberId || !canManageTeams) return;

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const timestamp = new Date().toISOString();
      const nextMemberIds = Array.from(new Set([...selectedTeam.memberIds, memberId]));
      await updateDoc(doc(db, 'companies', company.id, 'teams', selectedTeam.id), {
        memberIds: nextMemberIds,
        updatedAt: timestamp,
      });
      await updateDoc(doc(db, 'companies', company.id, 'users', memberId), {
        teamId: selectedTeam.id,
        updatedAt: timestamp,
      });
      setMessage('Member added to team.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member to team.');
    } finally {
      setSaving(false);
    }
  };

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!company || !profile || !selectedTeamId || !canManageTeams) return;
    if (!taskForm.assigneeId) {
      setError('Assign the task to one employee.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const taskRef = doc(collection(db, 'companies', company.id, 'teams', selectedTeamId, 'tasks'));
      const timestamp = new Date().toISOString();
      const attachments = await uploadAttachments(company.id, taskForm.assigneeId, 'tasks', taskFiles);
      const task: Task = {
        id: taskRef.id,
        companyId: company.id,
        teamId: selectedTeamId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: 'todo',
        priority: taskForm.priority as Task['priority'],
        assigneeId: taskForm.assigneeId,
        attachments,
        submissionText: '',
        submissionAttachments: [],
        submittedAt: '',
        completedBy: '',
        createdBy: profile.uid,
        updatedBy: profile.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await setDoc(taskRef, task);
      setTaskForm({ title: '', description: '', assigneeId: '', priority: 'medium' });
      setTaskFiles([]);
      setMessage('Task assigned. The employee will see it on their home screen.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const submitTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!company || !profile || !activeTask) return;
    if (!submissionText.trim()) {
      setError('Paste the README submission before submitting.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const timestamp = new Date().toISOString();
      const attachments = await uploadAttachments(company.id, profile.uid, 'submissions', submissionFiles);
      const nextTask: Task = {
        ...activeTask,
        status: 'done',
        submissionText: submissionText.trim(),
        submissionAttachments: attachments,
        submittedAt: timestamp,
        completedBy: profile.uid,
        updatedBy: profile.uid,
        updatedAt: timestamp,
      };
      await updateDoc(doc(db, 'companies', company.id, 'teams', activeTask.teamId, 'tasks', activeTask.id), {
        status: 'done',
        submissionText: submissionText.trim(),
        submissionAttachments: attachments,
        submittedAt: timestamp,
        completedBy: profile.uid,
        updatedBy: profile.uid,
        updatedAt: timestamp,
      });
      setActiveTask(nextTask);
      setAttendanceTask(nextTask);
      setSubmissionFiles([]);
      setMessage('README submitted. Mark attendance to complete the workflow.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task.');
    } finally {
      setSaving(false);
    }
  };

  const markAttendance = async () => {
    if (!company || !profile || !attendanceTask) return;

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      const attendanceRef = doc(
        db,
        'companies',
        company.id,
        'teams',
        attendanceTask.teamId,
        'attendance',
        `${profile.uid}_${date}`
      );
      const timestamp = new Date().toISOString();
      const entry: Attendance = {
        id: attendanceRef.id,
        companyId: company.id,
        teamId: attendanceTask.teamId,
        userId: profile.uid,
        date,
        status: 'present',
        taskId: attendanceTask.id,
        submittedAt: attendanceTask.submittedAt || timestamp,
        markedAt: timestamp,
        shiftStart: shift.start,
        shiftEnd: shift.end,
      };
      await setDoc(attendanceRef, entry, { merge: true });
      setAttendanceTask(null);
      setActiveTask(null);
      setSubmissionText('');
      setMessage('Attendance marked for today.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance.');
    } finally {
      setSaving(false);
    }
  };

  const openTask = (task: Task) => {
    setActiveTask(task);
    setSubmissionText(task.submissionText || '');
    setSubmissionFiles([]);
    setAttendanceTask(null);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-white text-neutral-950">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Syncro</p>
              <h1 className="text-2xl font-semibold">{company?.name || 'Choose a workspace'}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800">
                Home
              </Link>
              <div className="text-right text-sm">
                <p className="font-medium">{user?.displayName || profile?.displayName || user?.email}</p>
                <p className="text-neutral-500"><RoleText role={currentRole} /></p>
              </div>
              <button onClick={handleLogout} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {message && <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">{message}</div>}

          {!loading && !company ? (
            <section className="border border-neutral-200 bg-white p-6">
              <h2 className="text-xl font-semibold">Create or open a workspace</h2>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                A workspace is shared company data. Employees sign in with their email and the same workspace slug to see their assigned work.
              </p>
              <form onSubmit={openWorkspace} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
                <input
                  value={workspaceInput}
                  onChange={(event) => setWorkspaceInput(event.target.value)}
                  placeholder="workspace-slug"
                  className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  required
                />
                <button disabled={saving} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">Open workspace</button>
              </form>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <section className="min-w-0">
                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Metric label="Teams" value={visibleTeams.length} />
                  <Metric label="Assigned" value={tasks.length} />
                  <Metric label="Submitted" value={submittedTasks.length} />
                  <Metric label="Present Today" value={todayAttendance.length} />
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  {views.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium ${
                        view === item.id
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-300 bg-white text-neutral-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {view === 'workspace' && (
                  <WorkspacePanel
                    canManageTeams={canManageTeams}
                    canReviewWork={canReviewWork}
                    selectedTeamId={selectedTeamId}
                    selectedTeam={selectedTeam}
                    teams={visibleTeams}
                    tasks={tasks}
                    myTasks={myTasks}
                    users={users}
                    assignableUsers={assignableUsers}
                    taskForm={taskForm}
                    taskFiles={taskFiles}
                    saving={saving}
                    setSelectedTeamId={setSelectedTeamId}
                    setTaskForm={setTaskForm}
                    setTaskFiles={setTaskFiles}
                    createTask={createTask}
                    openTask={openTask}
                  />
                )}

                {view === 'teams' && (
                  <TeamPanel
                    canManageTeams={canManageTeams}
                    isAdmin={isAdmin}
                    teams={visibleTeams}
                    users={users}
                    selectedTeamId={selectedTeamId}
                    selectedTeam={selectedTeam}
                    teamForm={teamForm}
                    saving={saving}
                    setSelectedTeamId={setSelectedTeamId}
                    setTeamForm={setTeamForm}
                    createTeam={createTeam}
                    addMemberToSelectedTeam={addMemberToSelectedTeam}
                  />
                )}

                {view === 'members' && (
                  <MembersPanel
                    canManageTeams={canManageTeams}
                    users={users}
                    workspaceId={workspaceId}
                    memberForm={memberForm}
                    saving={saving}
                    setMemberForm={setMemberForm}
                    addWorkspaceMember={addWorkspaceMember}
                  />
                )}
              </section>

              <RightRail
                nowText={nowText}
                today={today}
                shift={shift}
                alarmArmed={alarmArmed}
                alarmMessage={alarmMessage}
                attendance={attendance}
                users={users}
                setShift={saveShift}
                setAlarmArmed={setAlarmArmed}
              />
            </div>
          )}
        </main>

        {activeTask && (
          <TaskModal
            task={activeTask}
            users={users}
            canReviewWork={canReviewWork}
            saving={saving}
            submissionText={submissionText}
            submissionFiles={submissionFiles}
            attendanceTask={attendanceTask}
            setSubmissionText={setSubmissionText}
            setSubmissionFiles={setSubmissionFiles}
            submitTask={submitTask}
            markAttendance={markAttendance}
            close={() => {
              setActiveTask(null);
              setAttendanceTask(null);
            }}
          />
        )}
      </div>
    </RequireAuth>
  );
}

function WorkspacePanel(props: {
  canManageTeams: boolean;
  canReviewWork: boolean;
  selectedTeamId: string;
  selectedTeam?: Team;
  teams: Team[];
  tasks: Task[];
  myTasks: Task[];
  users: User[];
  assignableUsers: User[];
  taskForm: { title: string; description: string; assigneeId: string; priority: string };
  taskFiles: File[];
  saving: boolean;
  setSelectedTeamId: (id: string) => void;
  setTaskForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; assigneeId: string; priority: string }>>;
  setTaskFiles: (files: File[]) => void;
  createTask: (event: FormEvent) => void;
  openTask: (task: Task) => void;
}) {
  const shownTasks = props.canReviewWork ? props.tasks : props.myTasks;

  return (
    <div className="space-y-6">
      <section className="border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Assigned Work</h2>
            <p className="text-sm text-neutral-600">
              {props.canReviewWork ? 'Assign separate tasks and review employee submissions.' : 'Your assigned tasks appear here only for you.'}
            </p>
          </div>
          <select
            value={props.selectedTeamId}
            onChange={(event) => props.setSelectedTeamId(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">No team selected</option>
            {props.teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </section>

      {props.canManageTeams && (
        <section className="border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Assign Task</h2>
          <form onSubmit={props.createTask} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              value={props.taskForm.title}
              onChange={(event) => props.setTaskForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Task title"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
              required
            />
            <select
              value={props.taskForm.assigneeId}
              onChange={(event) => props.setTaskForm((current) => ({ ...current, assigneeId: event.target.value }))}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Assign employee</option>
              {props.assignableUsers.map((person) => (
                <option key={person.uid} value={person.uid}>
                  {person.displayName || person.email}{person.pending ? ' (pending)' : ''}
                </option>
              ))}
            </select>
            <button disabled={!props.selectedTeamId || props.saving} className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-400">
              {props.saving ? 'Saving...' : 'Assign'}
            </button>
            <textarea
              value={props.taskForm.description}
              onChange={(event) => props.setTaskForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Write the complete task brief here. Employees will read this in a notepad view."
              className="min-h-40 rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm leading-6 md:col-span-4"
              required
            />
            <input
              type="file"
              multiple
              onChange={(event) => props.setTaskFiles(Array.from(event.target.files || []))}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm md:col-span-4"
            />
            {props.taskFiles.length > 0 && (
              <p className="text-xs text-neutral-500 md:col-span-4">{props.taskFiles.length} file(s) selected</p>
            )}
          </form>
        </section>
      )}

      <section className="border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">{props.canReviewWork ? 'Team Task Tracker' : 'My Home Screen'}</h2>
        {shownTasks.length === 0 ? (
          <p className="border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">
            {props.selectedTeam ? 'No tasks to show yet.' : 'Create or select a team to begin.'}
          </p>
        ) : (
          <div className="grid gap-3">
            {shownTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => props.openTask(task)}
                className="grid gap-3 rounded-md border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-950 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{task.title}</p>
                    <StatusPill task={task} />
                  </div>
                  <p className="mt-2 line-clamp-2 font-mono text-sm leading-6 text-neutral-600">{task.description || 'No task brief.'}</p>
                  <p className="mt-2 text-xs text-neutral-500">Assigned to {displayMember(task.assigneeId || '', props.users)}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Open Notepad</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TeamPanel(props: {
  canManageTeams: boolean;
  isAdmin: boolean;
  teams: Team[];
  users: User[];
  selectedTeamId: string;
  selectedTeam?: Team;
  teamForm: { name: string; description: string; leadId: string };
  saving: boolean;
  setSelectedTeamId: (id: string) => void;
  setTeamForm: React.Dispatch<React.SetStateAction<{ name: string; description: string; leadId: string }>>;
  createTeam: (event: FormEvent) => void;
  addMemberToSelectedTeam: (memberId: string) => void;
}) {
  const teamMemberIds = new Set(props.selectedTeam?.memberIds || []);
  const availableMembers = props.users.filter((person) => !teamMemberIds.has(person.uid));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <section className="border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Teams</h2>
        <select
          value={props.selectedTeamId}
          onChange={(event) => props.setSelectedTeamId(event.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">No team selected</option>
          {props.teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        {props.selectedTeam ? (
          <div className="border border-neutral-200 p-4 text-sm text-neutral-600">
            <p className="font-medium text-neutral-950">{props.selectedTeam.name}</p>
            <p>{props.selectedTeam.description || 'No description yet.'}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em]">Members</p>
            <div className="mt-2 divide-y divide-neutral-100">
              {props.users
                .filter((person) => teamMemberIds.has(person.uid))
                .map((person) => (
                  <p key={person.uid} className="py-2 text-sm text-neutral-700">
                    {person.displayName || person.email}{person.pending ? ' (pending)' : ''}
                  </p>
                ))}
            </div>
          </div>
        ) : (
          <p className="border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">Create a team to start assigning tasks.</p>
        )}
      </section>

      <aside className="space-y-6">
        {props.canManageTeams && (
          <section className="border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">Create Team</h2>
            <form onSubmit={props.createTeam} className="space-y-3">
              <input
                value={props.teamForm.name}
                onChange={(event) => props.setTeamForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Team name"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                required
              />
              <input
                value={props.teamForm.description}
                onChange={(event) => props.setTeamForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {props.isAdmin && (
                <select
                  value={props.teamForm.leadId}
                  onChange={(event) => props.setTeamForm((current) => ({ ...current, leadId: event.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">Use me as lead</option>
                  {props.users.map((person) => (
                    <option key={person.uid} value={person.uid}>
                      {person.displayName || person.email}{person.pending ? ' (pending)' : ''}
                    </option>
                  ))}
                </select>
              )}
              <button disabled={props.saving} className="w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-400">
                Create team
              </button>
            </form>
          </section>
        )}

        {props.canManageTeams && props.selectedTeam && (
          <section className="border border-neutral-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold">Add Team Member</h2>
            <select
              onChange={(event) => {
                props.addMemberToSelectedTeam(event.target.value);
                event.currentTarget.value = '';
              }}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              defaultValue=""
              disabled={props.saving}
            >
              <option value="">Select workspace member</option>
              {availableMembers.map((person) => (
                <option key={person.uid} value={person.uid}>
                  {person.displayName || person.email}{person.pending ? ' (pending)' : ''}
                </option>
              ))}
            </select>
          </section>
        )}
      </aside>
    </div>
  );
}

function MembersPanel(props: {
  canManageTeams: boolean;
  users: User[];
  workspaceId: string;
  memberForm: { displayName: string; email: string; role: UserRole };
  saving: boolean;
  setMemberForm: React.Dispatch<React.SetStateAction<{ displayName: string; email: string; role: UserRole }>>;
  addWorkspaceMember: (event: FormEvent) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      {props.canManageTeams && (
        <section className="border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">Add Employee</h2>
          <form onSubmit={props.addWorkspaceMember} className="space-y-3">
            <input
              value={props.memberForm.displayName}
              onChange={(event) => props.setMemberForm((current) => ({ ...current, displayName: event.target.value }))}
              placeholder="Full name"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
            <input
              value={props.memberForm.email}
              onChange={(event) => props.setMemberForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="email@example.com"
              type="email"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
            <select
              value={props.memberForm.role}
              onChange={(event) => props.setMemberForm((current) => ({ ...current, role: event.target.value as UserRole }))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="member">Employee</option>
              <option value="teamLead">Team Lead</option>
              <option value="companyAdmin">Company Admin</option>
            </select>
            <button disabled={props.saving} className="w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-400">
              Add employee
            </button>
          </form>
        </section>
      )}

      <section className="border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">Employees</h2>
        <p className="mb-4 text-sm text-neutral-600">Workspace: <strong>{props.workspaceId}</strong></p>
        <div className="divide-y divide-neutral-100">
          {props.users.map((person) => (
            <div key={person.uid} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium">{person.displayName || person.email}{person.pending ? ' (pending)' : ''}</p>
                <p className="text-neutral-500">{person.email}</p>
              </div>
              <RoleText role={person.role} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RightRail(props: {
  nowText: string;
  today: string;
  shift: ShiftSettings;
  alarmArmed: boolean;
  alarmMessage: string;
  attendance: Attendance[];
  users: User[];
  setShift: (shift: ShiftSettings) => void;
  setAlarmArmed: (armed: boolean) => void;
}) {
  const [draftShift, setDraftShift] = useState(props.shift);

  useEffect(() => setDraftShift(props.shift), [props.shift]);

  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <section className="border border-neutral-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Today</p>
        <p className="mt-2 text-2xl font-semibold">{props.today}</p>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          {calendarDays().map((day) => (
            <span key={day.value} className={`rounded py-1 ${day.isToday ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-700'}`}>
              {day.label}
            </span>
          ))}
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Clock</p>
        <p className="mt-2 font-mono text-3xl">{props.nowText || '--:--:--'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-neutral-600">
            Start
            <input
              type="time"
              value={draftShift.start}
              onChange={(event) => setDraftShift((current) => ({ ...current, start: event.target.value }))}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-neutral-600">
            End
            <input
              type="time"
              value={draftShift.end}
              onChange={(event) => setDraftShift((current) => ({ ...current, end: event.target.value }))}
              className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={() => props.setShift(draftShift)}
          className="mt-3 w-full rounded-md border border-neutral-950 px-4 py-2 text-sm font-medium"
        >
          Save shift
        </button>
        <button
          onClick={() => props.setAlarmArmed(!props.alarmArmed)}
          className="mt-2 w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
        >
          {props.alarmArmed ? 'Alarm armed' : 'Arm end-time alarm'}
        </button>
        {props.alarmMessage && <p className="mt-3 text-sm text-neutral-600">{props.alarmMessage}</p>}
      </section>

      <section className="border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">Attendance</h2>
        <div className="space-y-2">
          {props.attendance.length === 0 ? (
            <p className="text-sm text-neutral-600">No attendance marked yet.</p>
          ) : (
            props.attendance.slice(0, 8).map((entry) => (
              <div key={entry.id} className="border border-neutral-100 p-3 text-sm">
                <p className="font-medium">{displayMember(entry.userId, props.users)}</p>
                <p className="text-neutral-500">{entry.date} · {entry.shiftStart || '--:--'}-{entry.shiftEnd || '--:--'}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}

function TaskModal(props: {
  task: Task;
  users: User[];
  canReviewWork: boolean;
  saving: boolean;
  submissionText: string;
  submissionFiles: File[];
  attendanceTask: Task | null;
  setSubmissionText: (text: string) => void;
  setSubmissionFiles: (files: File[]) => void;
  submitTask: (event: FormEvent) => void;
  markAttendance: () => void;
  close: () => void;
}) {
  const alreadySubmitted = Boolean(props.task.submittedAt);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6">
      <div className="mx-auto flex max-h-[92vh] max-w-5xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-200 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Task Notepad</p>
            <h2 className="text-2xl font-semibold">{props.task.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">Assigned to {displayMember(props.task.assigneeId || '', props.users)}</p>
          </div>
          <button onClick={props.close} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">Close</button>
        </div>
        <div className="grid min-h-0 flex-1 gap-0 overflow-auto lg:grid-cols-[1fr_380px]">
          <section className="min-h-[420px] border-r border-neutral-200 bg-[#fffdf6] p-6">
            <pre className="whitespace-pre-wrap font-mono text-base leading-8 text-neutral-900">
              {props.task.description || 'No task brief was added.'}
            </pre>
            <AttachmentList attachments={props.task.attachments || []} />
          </section>
          <aside className="space-y-4 p-5">
            <StatusPill task={props.task} />
            {props.canReviewWork ? (
              <ReviewSubmission task={props.task} />
            ) : (
              <form onSubmit={props.submitTask} className="space-y-3">
                <label className="block text-sm font-semibold">README Submission</label>
                <textarea
                  value={props.submissionText}
                  onChange={(event) => props.setSubmissionText(event.target.value)}
                  placeholder="Paste your full README-style completion notes here."
                  className="min-h-72 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm leading-6"
                  disabled={alreadySubmitted}
                  required
                />
                <input
                  type="file"
                  multiple
                  onChange={(event) => props.setSubmissionFiles(Array.from(event.target.files || []))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  disabled={alreadySubmitted}
                />
                {props.submissionFiles.length > 0 && (
                  <p className="text-xs text-neutral-500">{props.submissionFiles.length} file(s) selected</p>
                )}
                {alreadySubmitted ? (
                  <p className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                    Submitted. Attendance can be marked after each successful submission.
                  </p>
                ) : (
                  <button disabled={props.saving} className="w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:bg-neutral-400">
                    {props.saving ? 'Submitting...' : 'Submit README'}
                  </button>
                )}
              </form>
            )}
            {props.attendanceTask && (
              <div className="border border-neutral-950 p-4">
                <h3 className="font-semibold">Mark attendance?</h3>
                <p className="mt-1 text-sm text-neutral-600">Your task submission is saved. Mark today as present to complete the workflow.</p>
                <button onClick={props.markAttendance} disabled={props.saving} className="mt-3 w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white">
                  Mark present
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ReviewSubmission({ task }: { task: Task }) {
  if (!task.submittedAt) {
    return <p className="rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">No employee submission yet.</p>;
  }

  return (
    <div>
      <h3 className="font-semibold">Employee README</h3>
      <p className="mb-3 text-xs text-neutral-500">Submitted {new Date(task.submittedAt).toLocaleString()}</p>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-sm leading-6">
        {task.submissionText}
      </pre>
      <AttachmentList attachments={task.submissionAttachments || []} />
    </div>
  );
}

function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.path}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="block rounded-md border border-neutral-200 px-3 py-2 text-xs text-neutral-800 hover:border-neutral-950"
        >
          {attachment.name}
        </a>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-neutral-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({ task }: { task: Task }) {
  const label = task.submittedAt ? 'Submitted' : task.status === 'in-progress' ? 'In progress' : task.status === 'done' ? 'Done' : 'Assigned';
  return (
    <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700">
      {label}
    </span>
  );
}

async function uploadAttachments(companyId: string, userId: string, folder: string, files: File[]) {
  const uploads = files.map(async (file) => {
    const path = `companies/${companyId}/uploads/${userId}/${folder}/${Date.now()}-${safeFileName(file.name)}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return {
      name: file.name,
      url,
      path,
      type: file.type || 'application/octet-stream',
      size: file.size,
    };
  });

  return Promise.all(uploads);
}

function createUserProfile(
  user: NonNullable<ReturnType<typeof useAuth>['user']>,
  workspaceId: string,
  role: UserRole
): User {
  const timestamp = new Date().toISOString();
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'You',
    companyId: workspaceId,
    teamId: '',
    role,
    pending: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    isActive: true,
  };
}

function getMemberAliases(user: ReturnType<typeof useAuth>['user'], profile: User | null) {
  return Array.from(new Set([user?.uid || '', profile?.uid || '', emailKey(user?.email || '')].filter(Boolean)));
}

function displayMember(memberId: string, users: User[]) {
  const member = users.find((person) => person.uid === memberId);
  return member?.displayName || member?.email || memberId || 'Unassigned';
}

function calendarDays() {
  const current = new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days: Array<{ value: string; label: string; isToday: boolean }> = [];

  for (let index = 0; index < firstDay; index += 1) {
    days.push({ value: `blank-${index}`, label: '', isToday: false });
  }
  for (let day = 1; day <= lastDate; day += 1) {
    days.push({ value: String(day), label: String(day), isToday: day === current.getDate() });
  }
  return days;
}

function ringShiftAlarm(endTime: string, setAlarmMessage: (message: string) => void) {
  const message = `Shift ended at ${endTime}.`;
  setAlarmMessage(message);

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 880;
    oscillator.connect(audioContext.destination);
    oscillator.start();
    window.setTimeout(() => {
      oscillator.stop();
      void audioContext.close();
    }, 900);
  } catch {
    window.alert(message);
  }

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Syncro shift reminder', { body: message });
    } else if (Notification.permission !== 'denied') {
      void Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Syncro shift reminder', { body: message });
        }
      });
    }
  }
}

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
}
