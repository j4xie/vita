#!/usr/bin/env ruby

# 自动将RNAlipayModule文件添加到Xcode项目的脚本
# 使用xcodeproj gem

require 'xcodeproj'

PROJECT_PATH = 'Pomelo.xcodeproj'
TARGET_NAME = 'Pomelo'
FILES_TO_ADD = [
  { path: 'Pomelo/RNAlipayModule.h', type: 'header' },
  { path: 'Pomelo/RNAlipayModule.m', type: 'source' }
]

puts "🔧 Opening Xcode project: #{PROJECT_PATH}"
project = Xcodeproj::Project.open(PROJECT_PATH)

# 获取主target
target = project.targets.find { |t| t.name == TARGET_NAME }
unless target
  puts "❌ Target '#{TARGET_NAME}' not found!"
  exit 1
end

# 获取Pomelo group
group = project.main_group.groups.find { |g| g.display_name == 'Pomelo' }
unless group
  puts "❌ Group 'Pomelo' not found!"
  exit 1
end

FILES_TO_ADD.each do |file_info|
  file_path = file_info[:path]
  file_type = file_info[:type]

  puts "\n📁 Processing: #{file_path}"

  # 检查文件是否存在
  unless File.exist?(file_path)
    puts "⚠️  File not found: #{file_path}"
    next
  end

  # 检查文件是否已添加
  existing_file = group.files.find { |f| f.path == File.basename(file_path) }
  if existing_file
    puts "✅ File already in project: #{File.basename(file_path)}"
    next
  end

  # 添加文件引用
  file_ref = group.new_reference(file_path)
  puts "✅ Added file reference: #{File.basename(file_path)}"

  # 如果是源文件(.m)，添加到Compile Sources
  if file_type == 'source'
    target.source_build_phase.add_file_reference(file_ref)
    puts "✅ Added to Compile Sources"
  end
end

# 保存项目
puts "\n💾 Saving project..."
project.save

puts "\n🎉 Done! Files added to Xcode project successfully!"
puts "\n📝 Next steps:"
puts "1. Open Xcode and verify the files are visible"
puts "2. Product → Clean Build Folder (⌘⇧K)"
puts "3. Product → Build (⌘B)"
puts "\nOr run: npm run ios"
