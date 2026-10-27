import { useEffect, useState } from 'react';
import { TeamOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Layout,
  Modal,
  notification,
  Result,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd/lib';
import {
  inviteWorkspaceUser,
  type WorkspaceUser,
} from '../../business/merchantApplication';
import {
  readAccessToken,
  roleLabels,
  type DemoRole,
  type UserProfile,
} from '../../business/auth';
import { CONTACT_NUMBER_PATTERN, EMAIL_FORMAT_PATTERN } from '../../business/fieldValidation';
import { listUsersByRoleApi } from '../../infrastructure/AuthApi';

const USERS_PER_PAGE = 10;
type TeamRole = 'sales' | 'reviewer';
type InviteValues = Pick<
  WorkspaceUser,
  'name' | 'email' | 'contactNumber' | 'role'
>;

const columns: TableColumnsType<WorkspaceUser> = [
  {
    title: 'Team member',
    key: 'member',
    render: (_, user) => (
      <Space size="middle">
        <Avatar>
          {user.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </Avatar>
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{user.name}</Typography.Text>
          <Typography.Text type="secondary">{user.email}</Typography.Text>
        </Space>
      </Space>
    ),
  },
  { title: 'Contact number', dataIndex: 'contactNumber', key: 'contactNumber' },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    render: (userRole: DemoRole) => (
      <Tag color={userRole === 'sales' ? 'blue' : 'gold'}>
        {roleLabels[userRole]}
      </Tag>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: WorkspaceUser['status']) => (
      <Tag color={status === 'Active' ? 'green' : 'orange'}>{status}</Tag>
    ),
  }
];

export default function UsersPage({
  profile,
  role,
}: {
  profile: UserProfile;
  role: DemoRole;
}) {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<TeamRole>('sales');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm] = Form.useForm<InviteValues>();

  useEffect(() => {
    const token = readAccessToken();
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!token)
          throw new Error('Your session has expired. Please sign in again.');
        return listUsersByRoleApi(token, activeRole, page, USERS_PER_PAGE);
      })
      .then((items) => {
        if (!active) return;
        setUsers(
          items.map((user) => ({
            userId: user.userId,
            name: [user.firstName, user.middleName, user.lastName]
              .filter(Boolean)
              .join(' '),
            contactNumber: user.contactNumber || '—',
            email: user.email || '—',
            role: activeRole,
            status: 'Active',
          })),
        );
      })
      .catch((loadError: unknown) => {
        if (active)
          notification.error({
            message: 'Could not load team members',
            description:
              loadError instanceof Error
                ? loadError.message
                : 'Could not load team members.',
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeRole, page]);

  const changeRole = (nextRole: string) => {
    if (nextRole !== 'sales' && nextRole !== 'reviewer') return;
    setActiveRole(nextRole);
    setPage(1);
    setUsers([]);
    setLoading(true);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setUsers([]);
    setLoading(true);
  };

  const invite = async (values: InviteValues) => {
    try {
      inviteWorkspaceUser(profile, values);
      setInviteOpen(false);
      notification.success({
        message: 'Invitation prepared',
        description: `Invitation for ${values.email} is saved in this browser preview.`,
      });
      inviteForm.resetFields();
    } catch (inviteError) {
      notification.error({
        message: 'Unable to invite this user',
        description:
          inviteError instanceof Error
            ? inviteError.message
            : 'Unable to invite this user.',
      });
    }
  };

  if (role !== 'admin') {
    return (
      <Layout.Content className="mf-team-layout">
        <Result
          status="403"
          title="Team access is restricted"
          subTitle="Only administrators can view and manage team accounts."
        />
      </Layout.Content>
    );
  }

  const hasNextPage = users.length === USERS_PER_PAGE;
  const paginationTotal = page * USERS_PER_PAGE + (hasNextPage ? 1 : 0);

  return (
    <Layout.Content className="mf-team-layout">
      <Space className="mf-team-heading" align="start" size="large">
        <div>
          <Typography.Text type="secondary">ACCESS CONTROL</Typography.Text>
          <Typography.Title level={2}>Team members</Typography.Title>
          <Typography.Paragraph type="secondary">
            Manage roles and workspace access for your operations team.
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          icon={<TeamOutlined />}
          onClick={() => setInviteOpen(true)}
        >
          Invite member
        </Button>
      </Space>

      <Card className="mf-team-card">
        <Space className="mf-team-summary" align="center">
          <Avatar icon={<TeamOutlined />} />
          <div>
            <Typography.Text strong>
              {activeRole === 'sales' ? 'Sales members' : 'Reviewer members'}
            </Typography.Text>
            <Typography.Paragraph type="secondary">
              {users.length} shown on page {page}
            </Typography.Paragraph>
          </div>
        </Space>

        <Tabs
          activeKey={activeRole}
          onChange={changeRole}
          items={[
            { key: 'sales', label: 'Sales' },
            { key: 'reviewer', label: 'Reviewer' },
          ]}
        />
        <Spin spinning={loading}>
          <Table<WorkspaceUser>
            rowKey="userId"
            columns={columns}
            dataSource={users}
            locale={{
              emptyText: loading ? ' ' : `No ${activeRole} members found.`,
            }}
            pagination={{
              current: page,
              pageSize: USERS_PER_PAGE,
              total: paginationTotal,
              showSizeChanger: false,
              disabled: loading,
              onChange: changePage,
            }}
          />
        </Spin>
      </Card>

      <Typography.Paragraph className="mf-team-notice" type="secondary">
        Team records and invitations are preview data stored in this browser.
      </Typography.Paragraph>

      <Modal
        title="Invite a team member"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          Choose the access role that fits their responsibilities.
        </Typography.Paragraph>
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={invite}
          initialValues={{ role: 'sales' }}
        >
          <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Work email"
            validateTrigger="onChange"
            rules={[
              { required: true, message: 'Email address is required.' },
              { pattern: EMAIL_FORMAT_PATTERN, message: 'Enter a valid email address (name@domain.com).' },
            ]}
          >
            <Input placeholder="name@company.com" />
          </Form.Item>
          <Form.Item
            name="contactNumber"
            label="Contact number"
            validateTrigger="onChange"
            rules={[{ pattern: CONTACT_NUMBER_PATTERN, message: 'Enter a 10-digit contact number.' }]}
          >
            <Input inputMode="numeric" placeholder="10-digit number" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Workspace role"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'sales', label: 'Sales' },
                { value: 'reviewer', label: 'Reviewer' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Form.Item>
          <Space className="mf-team-modal-actions">
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Prepare invitation
            </Button>
          </Space>
        </Form>
      </Modal>
    </Layout.Content>
  );
}
