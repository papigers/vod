import React, { Component } from 'react';
import styled from 'styled-components';
import { Flex, Box } from 'grid-styled';

import DashboardCard from 'components/DashboardCard';
import QuotaChart from 'components/QuotaChart';
import AnalyticsLineChart from 'components/AnalyticsLineChart';

const QuantityStat = styled(Box)`
  text-align: center;
  background-color: ${({ theme }) => theme.palette.white};
  padding: 2em;
  margin: 2em 0.5em;
  border: 2px solid;
  border-color: ${({ theme }) => theme.palette.neutralLight};
  border-radius: 4px;
  flex: 1 1 0;

  div {
    font-size: 3.5em;
    color: ${({ theme }) => theme.palette.themePrimary};
  }

  span {
    font-size: 1.5em;
  }
`;

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
              <QuantityStat>
                <div>45</div>
                <span>סרטונים</span>
              </QuantityStat>
              <QuantityStat>
                <div>12</div>
                <span>פלייליסטים</span>
              </QuantityStat>
              <QuantityStat>
                <div>23</div>
                <span>עוקבים</span>
              </QuantityStat>
              <QuantityStat>
                <div>230</div>
                <span>תגובות</span>
              </QuantityStat>
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
                videos: [{ id: 'qztxN1SMfFQ2', name: 'משפחת שווץ פרק 2 - מבצר כריות' }],
                multiSelect: false,
                allSelect: true,
              }}
              tabs={[
                { id: 'likes', label: 'לייקים' },
                { id: 'comments', label: 'תגובות' },
                { id: 'views', label: 'צפיות' },
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
