<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckIn;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    /**
     * Log a member check-in. Authorized by Staff or Admin.
     */
    public function store(Request $request, $memberId)
    {
        $member = User::find($memberId);

        if (!$member || $member->role !== 'member') {
            return response()->json([
                'message' => 'Member not found or user is not a member.'
            ], 404);
        }

        // Record the check-in with the ID of the staff/admin who performed it
        $checkIn = CheckIn::create([
            'member_id' => $member->id,
            'checked_in_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Check-in processed successfully.',
            'check_in' => [
                'id' => $checkIn->id,
                'member' => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email
                ],
                'authorized_by' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'role' => $request->user()->role
                ],
                'created_at' => $checkIn->created_at->toIso8601String()
            ]
        ], 201);
    }

    /**
     * Retrieve list of today's check-ins.
     */
    public function index(Request $request)
    {
        $today = Carbon::today();

        $checkIns = CheckIn::whereDate('created_at', $today)
            ->with(['member:id,name,email', 'authorizer:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'date' => $today->toDateString(),
            'total_check_ins' => $checkIns->count(),
            'check_ins' => $checkIns->map(function ($log) {
                return [
                    'id' => $log->id,
                    'member_name' => $log->member->name ?? 'Unknown Member',
                    'member_email' => $log->member->email ?? '',
                    'checked_in_by' => $log->authorizer->name ?? 'Kiosk Self Check-In',
                    'timestamp' => $log->created_at->toIso8601String()
                ];
            })
        ]);
    }
}
