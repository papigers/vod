import React, { Component } from 'react';
import { Flex, Box } from 'grid-styled';

import DashboardCard from 'components/DashboardCard';
import QuotaChart from 'components/QuotaChart';
import AnalyticsLineChart from 'components/AnalyticsLineChart';
import AnalyticsStats from 'components/AnalyticsStats';

class StudioAnalytics extends Component {
  getManagedChannels() {
    const {
      user: { managedChannels, ...user },
    } = this.props;
    return [user].concat(managedChannels);
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
            <DashboardCard
              flex="1 1 65%"
              title="כמות תוכן"
              channelSelector={{
                channels: managedChannels,
                multiSelect: true,
                allSelect: true,
              }}
            >
              <AnalyticsStats />
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

export default StudioAnalytics;
