<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MemberController extends Controller
{
    /**
     * Search and list members for administrative desks.
     */
    public function index(Request $request)
    {
        $search = $request->query('query');
        $query = User::where('role', 'member');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', $search);
            });
        }

        $members = $query->get();

        return response()->json([
            'members' => $members->map(function ($member) {
                // Simulate package statuses and metadata
                // Members with IDs divisible by 5 are Suspended, divisible by 3 are Expired, others are Active
                $status = 'Active';
                if ($member->id % 3 === 0) {
                    $status = 'Expired';
                } elseif ($member->id % 5 === 0) {
                    $status = 'Suspended';
                }

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'phone' => '+1 (555) 018-' . str_pad($member->id, 3, '0', STR_PAD_LEFT),
                    'profile_photo' => "https://images.unsplash.com/photo-" . (1500000000000 + ($member->id * 100000)) . "?auto=format&fit=crop&q=80&w=150&h=150",
                    'membership_status' => $status,
                ];
            })
        ]);
    }

    /**
     * Fetch dashboard statistics for the logged-in member.
     */
    public function dashboard(Request $request)
    {
        $member = $request->user();

        if ($member->role !== 'member') {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        // Mock status logic matching the directory logic
        $status = 'Active';
        $daysLeft = 60;
        if ($member->id % 3 === 0) {
            $status = 'Expired';
            $daysLeft = 0;
        } elseif ($member->id % 5 === 0) {
            $status = 'Suspended';
            $daysLeft = 14;
        }

        return response()->json([
            'package' => [
                'name' => 'Elite Club Quarterly Membership',
                'status' => $status,
                'days_left' => $daysLeft,
                'expires_at' => Carbon::now()->addDays($daysLeft)->toDateString(),
            ],
            'bmi_history' => [
                ['date' => 'Jan', 'bmi' => 26.1],
                ['date' => 'Feb', 'bmi' => 25.5],
                ['date' => 'Mar', 'bmi' => 24.8],
                ['date' => 'Apr', 'bmi' => 24.2],
                ['date' => 'May', 'bmi' => 23.9],
            ],
            'class_slots' => [
                ['id' => 1, 'name' => 'HIIT & Endurance Circuit', 'trainer' => 'Sarah J.', 'time' => '07:30 AM', 'available' => 8],
                ['id' => 2, 'name' => 'Core Strength Power Yoga', 'trainer' => 'Marcus K.', 'time' => '09:00 AM', 'available' => 15],
                ['id' => 3, 'name' => 'Strength & Powerlifting', 'trainer' => 'Arnold S.', 'time' => '06:00 PM', 'available' => 0],
            ],
        ]);
    }

    /**
     * Create a new member. Admin Only.
     */
    public function store(Request $request)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin rights required.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
        ]);

        $member = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt('password'),
            'role' => 'member',
        ]);

        return response()->json([
            'message' => 'Member created successfully.',
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'phone' => '+1 (555) 018-' . str_pad($member->id, 3, '0', STR_PAD_LEFT),
                'profile_photo' => "https://images.unsplash.com/photo-" . (1500000000000 + ($member->id * 100000)) . "?auto=format&fit=crop&q=80&w=150&h=150",
                'membership_status' => 'Active',
            ]
        ], 201);
    }

    /**
     * Update member details. Admin Only.
     */
    public function update(Request $request, $id)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin rights required.'], 403);
        }

        $member = User::where('id', $id)->where('role', 'member')->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found.'], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $member->id,
        ]);

        $member->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json([
            'message' => 'Member updated successfully.',
            'member' => $member
        ]);
    }
}
