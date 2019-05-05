import React, { Component } from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';
import { Box, Flex } from 'grid-styled';
import { createStructuredSelector } from 'reselect';
import { Link } from 'react-router-dom';

import createReduxContainer from 'utils/createReduxContainer';
import { makeSelectUser } from 'containers/Root/selectors';

import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

import DashboardCard from 'components/DashboardCard';
import QuotaChart from 'components/QuotaChart';
import AnalyticsLineChart from 'components/AnalyticsLineChart';
import SubmittedWorkflows from 'components/SubmittedWorkflows';

const WorkflowList = styled(SubmittedWorkflows)`
  & .ms-List::after {
    background-image: linear-gradient(
      transparent 30%,
      ${({ theme }) => transparentize(0.6, theme.palette.neutralLighterAlt)} 65%,
      ${({ theme }) => theme.palette.neutralLighterAlt} 100%
    );
  }
`;

class MgmtHomeDashboard extends Component {
  getManagedChannels() {
    const {
      user: { managedChannels, ...user },
    } = this.props;
    return [user].concat(managedChannels || []);
  }

  render() {
    const managedChannels = this.getManagedChannels();

    return (
      <Flex justifyContent="center">
        <Box width={0.95} py={12} mx={10}>
          <Flex flexWrap="wrap" justifyContent="space-between">
            <DashboardCard
              title="ניצול אחסון"
              channelSelector={{
                channels: managedChannels,
                multiSelect: false,
              }}
            >
              <QuotaChart />
            </DashboardCard>
            <DashboardCard title="הבקשות שלי" flex="1 1 0">
              <Box p={2} width={1} style={{ height: '100%' }}>
                <Flex
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  style={{ height: '100%' }}
                >
                  <WorkflowList minimal />
                  <Link to="/mgmt/my-workflows">
                    <DefaultButton primary>עוד</DefaultButton>
                  </Link>
                </Flex>
              </Box>
            </DashboardCard>
            <DashboardCard
              flex="1 1 0"
              title="תרשים חשיפה"
              channelSelector={{
                channels: managedChannels,
                multiSelect: true,
                allSelect: true,
              }}
              videoSelector={{
                videos: 'channel',
                multiSelect: false,
                allSelect: true,
              }}
              tabs={[
                { key: 'likes', label: 'לייקים' },
                { key: 'comments', label: 'תגובות' },
                { key: 'views', label: 'צפיות' },
              ]}
            >
              <AnalyticsLineChart />
            </DashboardCard>
          </Flex>
        </Box>
      </Flex>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  user: makeSelectUser(),
});

export default createReduxContainer(MgmtHomeDashboard, mapStateToProps);
