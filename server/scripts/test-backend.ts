import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const employeeUser = {
  email: `emp_${Date.now()}@test.com`,
  password: 'password123',
  firstName: 'Test',
  lastName: 'Employee',
  role: 'EMPLOYEE',
};

const seekerUser = {
  email: `seeker_${Date.now()}@test.com`,
  password: 'password123',
  firstName: 'Test',
  lastName: 'Seeker',
  role: 'SEEKER',
};

let employeeToken = '';
let seekerToken = '';
let referralId = '';

async function testBackend() {
  try {
    console.log('--- STARTING BACKEND TESTS ---');

    // 1. Register Employee
    console.log('\n1. Registering Employee...');
    try {
      const empRes = await axios.post(`${API_URL}/auth/signup`, employeeUser);
      console.log('✅ Employee Registered:', empRes.data.user.email);
      employeeToken = empRes.data.token;
    } catch (error: any) {
      console.error(
        '❌ Employee Registration Failed:',
        error.response?.data || error.message,
      );
      return;
    }

    // 2. Register Seeker
    console.log('\n2. Registering Seeker...');
    try {
      const seekRes = await axios.post(`${API_URL}/auth/signup`, seekerUser);
      console.log('✅ Seeker Registered:', seekRes.data.user.email);
      seekerToken = seekRes.data.token;
    } catch (error: any) {
      console.error(
        '❌ Seeker Registration Failed:',
        error.response?.data || error.message,
      );
      return;
    }

    // 3. Create Referral (as Employee)
    console.log('\n3. Creating Referral Post (as Employee)...');
    try {
      const referralData = {
        jobRole: 'Senior React Developer',
        department: 'Engineering',
        experienceLevel: '5+ Years',
        description: 'Great opportunity to join our team.',
        referralPrice: 50.0,
      };

      const refRes = await axios.post(`${API_URL}/referrals`, referralData, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      console.log('✅ Referral Created:', refRes.data.id);
      referralId = refRes.data.id;
    } catch (error: any) {
      console.error(
        '❌ Create Referral Failed:',
        error.response?.data || error.message,
      );
    }

    // 4. Fetch Referrals (Public)
    console.log('\n4. Fetching Referrals (Public)...');
    try {
      const getRes = await axios.get(`${API_URL}/referrals`);
      const found = getRes.data.find((r: any) => r.id === referralId);
      if (found) {
        console.log('✅ Created referral found in public list.');
      } else {
        console.error('❌ Referral NOT found in public list.');
      }
    } catch (error: any) {
      console.error(
        '❌ Fetch Referrals Failed:',
        error.response?.data || error.message,
      );
    }

    // 5. Apply for Referral (as Seeker) - Create Appointment
    console.log('\n5. Applying for Referral (as Seeker)...');
    try {
      const appData = {
        referralPostId: referralId,
        message: 'I am interested in this role!',
      };

      const appRes = await axios.post(`${API_URL}/appointments`, appData, {
        headers: { Authorization: `Bearer ${seekerToken}` },
      });
      console.log('✅ Appointment Created:', appRes.data.id);
    } catch (error: any) {
      console.error(
        '❌ Apply Referral Failed:',
        error.response?.data || error.message,
      );
    }

    // 6. Verify Employee sees the Appointment
    console.log('\n6. Verifying Employee Sees Appointment...');
    try {
      const myReferralsRes = await axios.get(`${API_URL}/referrals/my`, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });

      const myReferral = myReferralsRes.data.find(
        (r: any) => r.id === referralId,
      );
      if (
        myReferral &&
        myReferral.appointments &&
        myReferral.appointments.length > 0
      ) {
        console.log(
          `✅ Employee sees ${myReferral.appointments.length} appointment(s) for the referral.`,
        );
      } else {
        console.error('❌ Employee did NOT see the appointment.');
        console.log(
          'Debug Response:',
          JSON.stringify(myReferralsRes.data, null, 2),
        );
      }
    } catch (error: any) {
      console.error(
        '❌ Verify Employee Appointments Failed:',
        error.response?.data || error.message,
      );
    }

    console.log('\n--- BACKEND TESTS COMPLETED ---');
  } catch (error) {
    console.error('Unexpected Test Script Error:', error);
  }
}

testBackend();
