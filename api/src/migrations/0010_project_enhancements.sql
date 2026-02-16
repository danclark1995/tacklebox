-- Migration 0010: Project deadline and brief fields
-- Adds deadline and brief (rich notes) to projects table

ALTER TABLE projects ADD COLUMN deadline TEXT;
ALTER TABLE projects ADD COLUMN brief TEXT;
