import { NextRequest, NextResponse } from 'next/server';
import { enhancedDataManager } from '../../../../utils/storage/enhanced-data-store';

// READ - Get single mural by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid mural ID'
      }, { status: 400 });
    }
    
    const mural = await enhancedDataManager.getItemById('murals', id);
    
    if (!mural) {
      return NextResponse.json({
        success: false,
        error: 'Mural not found'
      }, { status: 404 });
    }
    
    // Get associated cards
    const cards = await enhancedDataManager.getData('cards');
    const muralCards = cards.filter(c => c.mural_id === id);
    
    return NextResponse.json({
      success: true,
      mural: { ...mural, cards: muralCards }
    });
    
  } catch (error) {
    console.error('Failed to fetch mural:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch mural'
    }, { status: 500 });
  }
}

// UPDATE - Update mural metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid mural ID'
      }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate update data
    const allowedFields = ['title', 'description', 'status', 'animator_versions'];
    const updates: Record<string, any> = {};
    
    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updates[key] = value;
      }
    });
    
    // Validate specific fields
    if (updates.title) {
      if (typeof updates.title !== 'string' || updates.title.length > 255) {
        return NextResponse.json({
          success: false,
          error: 'Invalid title'
        }, { status: 400 });
      }
      updates.title = updates.title.trim();
    }
    
    if (updates.status) {
      const validStatuses = ['draft', 'submitted', 'approved', 'published', 'archived'];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid status'
        }, { status: 400 });
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update'
      }, { status: 400 });
    }
    
    const updatedMural = await enhancedDataManager.updateItem('murals', id, updates);
    
    return NextResponse.json({
      success: true,
      mural: updatedMural,
      message: 'Mural updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update mural:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    }, { status: 500 });
  }
}

// DELETE - Delete mural and associated cards
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid mural ID'
      }, { status: 400 });
    }
    
    // Check if mural exists
    const mural = await enhancedDataManager.getItemById('murals', id);
    if (!mural) {
      return NextResponse.json({
        success: false,
        error: 'Mural not found'
      }, { status: 404 });
    }
    
    // Delete associated cards first
    const cards = await enhancedDataManager.getData('cards');
    const muralCards = cards.filter(c => c.mural_id === id);
    
    for (const card of muralCards) {
      try {
        await enhancedDataManager.deleteItem('cards', card.id);
      } catch (error) {
        console.warn(`Failed to delete card ${card.id}:`, error);
      }
    }
    
    // Delete the mural
    await enhancedDataManager.deleteItem('murals', id);
    
    return NextResponse.json({
      success: true,
      message: 'Mural deleted successfully',
      deletedCards: muralCards.length
    });
    
  } catch (error) {
    console.error('Failed to delete mural:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }, { status: 500 });
  }
}