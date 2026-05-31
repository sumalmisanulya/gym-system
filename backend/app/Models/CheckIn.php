<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckIn extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'checked_in_by',
    ];

    /**
     * Get the member who checked in.
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    /**
     * Get the staff/admin who authorized the check-in.
     */
    public function authorizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }
}
